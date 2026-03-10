"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function fetchRows() {
  const { data, error } = await supabaseServer
    .from("test_table")
    .select("*")
    .order("quantity", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function addRow(product: string, quantity: number, alertThreshold: number, expirationDate: string | null) {
  const { error } = await supabaseServer
    .from("test_table")
    .insert({ product, quantity, alert_threshold: alertThreshold, expiration_date: expirationDate });

  if (error) throw new Error(error.message);
}

export async function updateRow(id: number, product: string, quantity: number, alertThreshold: number, expirationDate: string | null) {
  const { error } = await supabaseServer
    .from("test_table")
    .update({ product, quantity, alert_threshold: alertThreshold, expiration_date: expirationDate })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteRow(id: number) {
  const { error } = await supabaseServer
    .from("test_table")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
