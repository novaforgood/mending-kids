"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchAlertItems() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select("*");

  if (error) throw new Error(error.message);
  return data;
}
