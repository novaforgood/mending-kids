"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchRows() {
  const { data, error } = await supabaseServer
    .from("test_table")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function addRow(product: string, quantity: number) {
  const { error } = await supabaseServer
    .from("test_table")
    .insert({ product, quantity });

  if (error) throw new Error(error.message);
}

export async function updateRow(id: number, product: string, quantity: number) {
  const { error } = await supabaseServer
    .from("test_table")
    .update({ product, quantity })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
