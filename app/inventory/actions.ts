"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { logInventoryChange } from "@/lib/logger";

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

/* Add a new inventory item */
export async function addItem(payload: InventoryPayload, userEmail: string) {
  const { data, error } = await supabaseServer
    .from("inventory")
    .insert({
      ...payload,
      total_value: payload.quantity * payload.market_value_per_unit,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  logInventoryChange("add", userEmail, data.id, payload.item_description);
}

/* Update documentation fields on an existing item */
export async function updateItemDocumentation(
  id: number,
  marketValuePerUnit: number,
  valuationSource: string,
  acquisitionMethod: string,
  userEmail: string
) {
  const { data: oldItem, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("quantity, item_description, market_value_per_unit, valuation_source, acquisition_method")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabaseServer
    .from("inventory")
    .update({
      market_value_per_unit: marketValuePerUnit,
      total_value: oldItem.quantity * marketValuePerUnit,
      valuation_source: valuationSource,
      acquisition_method: acquisitionMethod,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  logInventoryChange(
    "edit",
    userEmail,
    id,
    oldItem.item_description,
    {
      market_value_per_unit: { old: String(oldItem.market_value_per_unit), new: String(marketValuePerUnit) },
      valuation_source: { old: oldItem.valuation_source || "", new: valuationSource },
      acquisition_method: { old: oldItem.acquisition_method || "", new: acquisitionMethod },
    }
  );
}

// delete item
export async function deleteItem(id: number, userEmail: string) {
  const { data: item, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("item_description")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabaseServer
    .from("inventory")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  logInventoryChange("delete", userEmail, id, item.item_description);
}