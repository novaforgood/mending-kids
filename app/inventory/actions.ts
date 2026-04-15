"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type InventoryPayload = {
  item_description: string;
  manufacturer: string;
  reference_number: string;
  lot_number: string;
  unit_of_measure: string;
  typical_shelf_life: string;
  location: string;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date;
  market_value_per_unit: number;
  valuation_source: string;
  acquisition_method: string;
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

/** Normalize to 2 decimal places before send (DB should use numeric — see sql/inventory_money_numeric.sql). */
function money2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/* Add a new inventory item */
export async function addItem(payload: InventoryPayload) {
  const unit = money2(payload.market_value_per_unit);
  const { error } = await supabaseServer
    .from("inventory")
    .insert({
      ...payload,
      market_value_per_unit: unit,
      total_value: money2(payload.quantity * unit),
    });

  if (error) {
    throw new Error(error.message);
  }
}

/* Update documentation fields on an existing item */
export async function updateItemDocumentation(
  id: number,
  marketValuePerUnit: number,
  valuationSource: string,
  acquisitionMethod: string
) {
  const { data: item, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("quantity")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const unit = money2(marketValuePerUnit);

  const { error } = await supabaseServer
    .from("inventory")
    .update({
      market_value_per_unit: unit,
      total_value: money2(Number(item.quantity) * unit),
      valuation_source: valuationSource,
      acquisition_method: acquisitionMethod,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
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