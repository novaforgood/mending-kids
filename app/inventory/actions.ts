"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type InventoryPayload = {
  manufacturer: string;
  reference_number: string;
  quantity: number;
  unit: string;
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

/* Update an existing inventory item */
export async function updateItem(
  id: number,
  payload: Partial<InventoryPayload>
) {
  const updates: Record<string, any> = { ...payload };

  if (
    payload.quantity !== undefined &&
    payload.market_value_per_unit !== undefined
  ) {
    updates.total_value =
      payload.quantity * payload.market_value_per_unit;
  }

  const { error } = await supabaseServer
    .from("inventory")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

/* Optional: delete inventory item */
export async function deleteItem(id: number) {
  const { error } = await supabaseServer
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}