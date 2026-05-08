"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchMissions() {
  const { data, error } = await supabaseServer
    .from("missions")
    .select("*");

  if (error) throw new Error(error.message);
  return data;
}

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
