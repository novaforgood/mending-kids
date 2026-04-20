"use server";

import { supabaseServer } from "@/lib/supabase/server";

// ─── Missions ────────────────────────────────────────────────────────────────

export async function fetchMissions() {
  const [
    { data: missions, error: mErr },
    { data: itemCounts, error: iErr },
    { data: memberCounts, error: mbErr },
  ] = await Promise.all([
    supabaseServer.from("missions").select("*"),
    supabaseServer.from("mission_inventory").select("mission_id"),
    supabaseServer.from("mission_members").select("mission_id"),
  ]);

  if (mErr) throw new Error(mErr.message);
  // Treat missing join-table data as empty (don't break the page)
  const items = iErr ? [] : (itemCounts ?? []);
  const members = mbErr ? [] : (memberCounts ?? []);

  const itemMap = items.reduce<Record<number, number>>((acc, r) => {
    acc[r.mission_id] = (acc[r.mission_id] ?? 0) + 1;
    return acc;
  }, {});

  const memberMap = members.reduce<Record<number, number>>((acc, r) => {
    acc[r.mission_id] = (acc[r.mission_id] ?? 0) + 1;
    return acc;
  }, {});

  return (missions ?? []).map((m) => ({
    ...m,
    item_count: itemMap[m.id] ?? 0,
    member_count: memberMap[m.id] ?? 0,
  }));
}

export async function fetchMissionById(id: number) {
  const { data, error } = await supabaseServer
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as {
    id: number;
    mission_name: string;
    start_date: string;
    end_date: string;
    location: string;
    category: string;
    status: string;
    description: string | null;
    doctor_name: string | null;
    budget: number | null;
  };
}

export async function createMission(payload: {
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
}) {
  const { data, error } = await supabaseServer
    .from("missions")
    .insert({ ...payload, status: "planned" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMission(
  id: number,
  payload: {
    mission_name: string;
    start_date: string;
    end_date: string;
    location: string;
    category: string;
  }
) {
  const { data, error } = await supabaseServer
    .from("missions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Mission Items ────────────────────────────────────────────────────────────

export type MissionItem = {
  mission_item_id: number;   // mission_inventory.id
  mission_id: number;
  inventory_id: number;
  allocated_quantity: number; // mission_inventory.quantity_used
  // from inventory table
  id: number;
  item_description: string | null;
  manufacturer: string | null;
  reference_number: string | null;
  quantity: number;
  unit_of_measure: string | null;
  lot_number: string | null;
  expiration_date: string | null;
  status: string | null;
  location: string | null;
};

/** Items assigned to a mission, joined with inventory details. */
export async function fetchMissionItems(missionId: number): Promise<MissionItem[]> {
  const { data: links, error: lErr } = await supabaseServer
    .from("mission_inventory")
    .select("*")
    .eq("mission_id", missionId);

  if (lErr) throw new Error(lErr.message);
  if (!links?.length) return [];

  const ids = links.map((l) => l.inventory_id);
  const { data: inv, error: iErr } = await supabaseServer
    .from("inventory")
    .select("*")
    .in("id", ids);

  if (iErr) throw new Error(iErr.message);

  return links.map((link) => {
    const item = (inv ?? []).find((i) => i.id === link.inventory_id) ?? {};
    return {
      mission_item_id: link.id,
      mission_id: link.mission_id,
      inventory_id: link.inventory_id,
      allocated_quantity: link.quantity_used ?? 1,
      ...item,
    } as MissionItem;
  });
}

/** All inventory items available to add to a mission. */
export async function fetchAllInventoryItems() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select("id, item_description, manufacturer, reference_number, quantity, unit_of_measure, status, location")
    .order("item_description");

  if (error) throw new Error(error.message);
  return (data ?? []) as {
    id: number;
    item_description: string | null;
    manufacturer: string | null;
    reference_number: string | null;
    quantity: number;
    unit_of_measure: string | null;
    status: string | null;
    location: string | null;
  }[];
}

/** Add an inventory item to a mission. */
export async function addItemToMission(
  missionId: number,
  inventoryId: number,
  quantityUsed: number
) {
  const { data, error } = await supabaseServer
    .from("mission_inventory")
    .insert({ mission_id: missionId, inventory_id: inventoryId, quantity_used: quantityUsed })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Remove an item from a mission by mission_inventory.id */
export async function removeItemFromMission(missionItemId: number) {
  const { error } = await supabaseServer
    .from("mission_inventory")
    .delete()
    .eq("id", missionItemId);

  if (error) throw new Error(error.message);
}

/** Mission members (people). */
export async function fetchMissionMembers(missionId: number) {
  const { data, error } = await supabaseServer
    .from("mission_members")
    .select("*")
    .eq("mission_id", missionId);

  if (error) throw new Error(error.message);
  return (data ?? []) as {
    id: number;
    name: string;
    contact: string | null;
    form_filled: boolean;
    role: string | null;
    mission_id: number;
  }[];
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function fetchActivityLog() {
  const { data, error } = await supabaseServer
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(7);

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchAllActivityLog() {
  const { data, error } = await supabaseServer
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export type ActivityLogEntry = {
  id: number;
  created_at: string;
  action_type: string;
  performed_by: string;
  description: string;
  item_name: string | null;
  quantity: number | null;
  mission_id: number | null;
  inventory_id: number | null;
};

export async function fetchMissionActivityLog(missionId: number): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabaseServer
    .from("activity_log")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ActivityLogEntry[];
}
