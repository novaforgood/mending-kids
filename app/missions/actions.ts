"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchMissions() {
  const { data, error } = await supabaseServer
    .from("missions")
    .select("id, mission_name, start_date, end_date, location, category, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMission(input: 
  {mission_name: string; 
    start_date: string | null;
    end_date: string | null;
    location: string;
    category: string;
    status: string; 
  }) {  // Add quantity parameter
  const { data, error } = await supabaseServer
    .from("missions")
    .insert(input)
    .select("id")
    .single();  // Add quantity

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
  
) {  // Add quantity parameter
  const { error } = await supabaseServer
    .from("missions")
    .update(patch)  
    .eq("id", id);

  if (error) throw new Error(error.message);
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

/** 5) Add an item to a mission */
export async function addMissionItem(input: {
  mission_id: number;
  inventory_id: number;
  quantity: number;
}) {
  const { error } = await supabaseServer.from("mission_inventory").insert(input);
  if (error) throw new Error(error.message);
}

/** 6) Update quantity for an item on a mission */
export async function updateMissionItem(id: number, quantity: number) {
  const { error } = await supabaseServer
    .from("mission_inventory")
    .update({ quantity })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** 7) Remove an item from a mission */
export async function deleteMissionItem(id: number) {
  const { error } = await supabaseServer.from("mission_inventory").delete().eq("id", id);
  if (error) throw new Error(error.message);
}