"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchMissionInventory() {
  const { data, error } = await supabaseServer
    .from("mission_inventory")
    .select("id, mission_id, inventory_id, quantity_used, missions(mission_name)")
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}