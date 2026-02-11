"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchMissions() {
  const { data, error } = await supabaseServer
    .from("missions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addMission(mission_name: string, equipment: string, quantity: number) {  // Add quantity parameter
  const { error } = await supabaseServer
    .from("missions")
    .insert({ mission_name, equipment, quantity });  // Add quantity

  if (error) throw new Error(error.message);
}

export async function updateMission(id: number, mission_name: string, equipment: string, quantity: number) {  // Add quantity parameter
  const { error } = await supabaseServer
    .from("missions")
    .update({ mission_name, equipment, quantity })  // Add quantity
    .eq("id", id);

  if (error) throw new Error(error.message);
}