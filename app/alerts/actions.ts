"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchAlertItems() {
  const { data, error } = await supabaseServer
    .from("test_table")
    .select("*");

  if (error) throw new Error(error.message);
  return data;
}
