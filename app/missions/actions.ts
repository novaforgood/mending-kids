"use server";

import { requireAdmin } from "@/lib/supabase/server-auth";
import { supabaseServer } from "@/lib/supabase/server";

export type MissionPayload = {
  mission_name: string;
  description?: string | null;
  start_date?: string | null;  // keep as ISO string from <input type="date">
  end_date?: string | null;
  category?: string | null;
  location?: string | null;

  doctor_name?: string | null;
  doctor_email?: string | null;
  doctor_phone?: string | null;

  budget?: number | null;
  status?: string | null;
};

export async function fetchMissions() {
  const { data, error } = await supabaseServer
    .from("missions")
    .select("id, mission_name, start_date, end_date, location, category, status, created_at, mission_inventory(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const { data: memberCounts } = await supabaseServer
    .from("mission_members")
    .select("mission_id");

  const countMap: Record<number, number> = {};
  for (const row of memberCounts ?? []) {
    countMap[row.mission_id] = (countMap[row.mission_id] ?? 0) + 1;
  }

  return (data ?? []).map((m) => ({ ...m, memberCount: countMap[m.id] ?? 0 }));
}

export async function addMission(payload: any) {
  await requireAdmin();
  const insertRow = {
    mission_name: payload.mission_name,
    description: payload.description ?? null,
    start_date: payload.start_date ?? null,
    end_date: payload.end_date ?? null,
    location: payload.location ?? null,
    category: payload.category ?? null,
    doctor_name: payload.doctor_name ?? null,
    doctor_email: payload.doctor_email ?? null,
    doctor_phone: payload.doctor_phone ?? null,
    team_members: payload.team_members ?? null,
    budget: payload.budget ?? null,
    status: payload.status ?? "planned",
  };

  const { data, error } = await supabaseServer
    .from("missions")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMission(
  id: number,
  patch: Partial<{
    mission_name: string;
    start_date: string;
    end_date: string;
    location: string;
    category: string;
    status: string;
  }> 
  
) {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("missions")
    .update(patch)  
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Fetch all editable fields for a single mission (used by Edit Mission panel) */
export async function fetchMissionFull(id: number) {
  const { data, error } = await supabaseServer
    .from("missions")
    .select(
      "id, mission_name, description, start_date, end_date, location, category, status, doctor_name, doctor_email, doctor_phone, team_members, budget"
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** 4) Mission detail: header + items */
export async function fetchMissionDetail(missionId: number) {
  // 1) Mission header
  const { data: mission, error: missionError } = await supabaseServer
    .from("missions")
    .select("id, mission_name, start_date, end_date, location, category, status, created_at")
    .eq("id", missionId)
    .single();

  if (missionError) throw new Error(missionError.message);

   // 2) Items for this mission (join mission_inventory -> inventory)
  const { data: items, error: itemsError } = await supabaseServer
    .from("mission_inventory")
    .select(`
      id,
      quantity_used,
      inventory:inventory_id ( * )
    `)
    .eq("mission_id", missionId);

  if (itemsError) throw new Error(itemsError.message);

  return { mission, items: items ?? [] };
}

/** 5) Fetch all inventory items */
export async function fetchInventory() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select("id, item_description, manufacturer, reference_number, expiration_date, quantity, unit_of_measure")
    .order("item_description", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 6) Add an item to a mission */
export async function addMissionItem(input: {
  mission_id: number;
  inventory_id: number;
  quantity: number;
}) {
  await requireAdmin();

  const { error: insertError } = await supabaseServer.from("mission_inventory").insert({
    mission_id: input.mission_id,
    inventory_id: input.inventory_id,
    quantity_used: input.quantity,
  });
  if (insertError) throw new Error(insertError.message);

  const { data: inv, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("quantity")
    .eq("id", input.inventory_id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const newQty = Math.max(0, (inv.quantity ?? 0) - input.quantity);
  const { error: updateError } = await supabaseServer
    .from("inventory")
    .update({ quantity: newQty })
    .eq("id", input.inventory_id);
  if (updateError) throw new Error(updateError.message);
}

// ─── Mission Members ────────────────────────────────────────────────────────

/** Fetch all members for a mission */
export async function fetchMissionMembers(missionId: number) {
  const { data, error } = await supabaseServer
    .from("mission_members")
    .select("id, name, contact, form_filled, role")
    .eq("mission_id", missionId)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Add a member to a mission */
export async function addMissionMember(input: {
  mission_id: number;
  name: string;
  contact?: string | null;
  form_filled?: boolean;
  role?: string | null;
}) {
  await requireAdmin();

  const { error } = await supabaseServer.from("mission_members").insert({
    mission_id: input.mission_id,
    name: input.name,
    contact: input.contact ?? null,
    form_filled: input.form_filled ?? false,
    role: input.role ?? null,
  });

  if (error) throw new Error(error.message);
}
/** Update a mission member */
export async function updateMissionMember(
  id: number,
  patch: Partial<{ name: string; contact: string; form_filled: boolean; role: string }>
) {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("mission_members")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(error.message);
}
/** Remove a member from a mission */
export async function deleteMissionMember(id: number) {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("mission_members")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** 6) Update quantity for an item on a mission */
export async function updateMissionItem(id: number, quantity: number) {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("mission_inventory")
    .update({ quantity_used: quantity })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** 7) Remove an item from a mission */
export async function deleteMissionItem(id: number) {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("mission_inventory")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}