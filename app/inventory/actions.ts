"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type InventoryPayload = {
  item_description: string;
  manufacturer: string;
  reference_number: string;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date;
  market_value_per_unit: number;
};

/* Fetch all inventory items */
export async function fetchInventory() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/* Add a new inventory item */
export async function addItem(payload: InventoryPayload) {
  const { error } = await supabaseServer
    .from("inventory")
    .insert({
      ...payload,
      total_value: payload.quantity * payload.market_value_per_unit,
    });

  if (error) {
    throw new Error(error.message);
  }
}

// delete item
export async function deleteItem(id: number) {
  const { error } = await supabaseServer
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}