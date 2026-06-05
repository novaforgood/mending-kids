"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { InventoryPayload, ChangeType, UpdateItemDetailsPayload } from "./types";

async function logInventoryChange(
  type: ChangeType,
  user: string,
  itemId?: number,
  itemDescription?: string,
  changes?: Record<string, { old: string; new: string }>,
  quantity?: number,
  missionId?: number
) {
  let description = itemDescription || "";

  if (changes) {
    const changeDescriptions = Object.entries(changes).map(
      ([field, { old: oldVal, new: newVal }]) =>
        `${field}: "${oldVal}" → "${newVal}"`
    );

    description +=
      changeDescriptions.length > 0
        ? ` (${changeDescriptions.join(", ")})`
        : "";
  }

  await supabaseServer.from("activity_log").insert({
    action_type: type,
    performed_by: user,
    description,
    item_name: itemDescription,
    inventory_id: itemId,
    quantity,
    mission_id: missionId,
  });
}

/* Fetch all inventory items */
export async function fetchItemActivityLog(inventoryId: number) {
  const { data, error } = await supabaseServer
    .from("activity_log")
    .select("*")
    .eq("inventory_id", inventoryId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/* Fetch all inventory items */
export async function fetchInventory() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select(`*, mission_inventory(mission_id, quantity_used, missions(mission_name))`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/** Normalize to 2 decimal places before send */
function money2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function getInventoryStatus(quantity: number, expiration: Date | string | null | undefined): string {
  const now = new Date();
  const expirationDate = expiration ? new Date(expiration) : null;

  if (expirationDate && !Number.isNaN(expirationDate.getTime()) && expirationDate < now) {
    return "Expired";
  }

  if (quantity < 50) {
    return "Low Stock";
  }

  return "In Stock";
}

/* Add a new inventory item */
export async function addItem(payload: InventoryPayload, userEmail: string) {
  const { data, error } = await supabaseServer
    .from("inventory")
    .insert({
      ...payload,
      created_by: userEmail,
      total_value: money2(payload.quantity * payload.market_value_per_unit),
      status: getInventoryStatus(payload.quantity, payload.expiration),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseServer.from("inventory_entries").insert({
    inventory_id: data.id,
    quantity_added: payload.quantity,
    notes: "Initial quantity",
    added_by: userEmail,
    date_added: new Date().toISOString().split("T")[0],
  });

  await logInventoryChange(
    "added",
    userEmail,
    data.id,
    payload.item_description,
    undefined,
    payload.quantity
  );
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
    .select(
      "quantity, item_description, market_value_per_unit, valuation_source, acquisition_method"
    )
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const unit = money2(marketValuePerUnit);

  const { error } = await supabaseServer
    .from("inventory")
    .update({
      market_value_per_unit: unit,
      total_value: money2(oldItem.quantity * unit),
      valuation_source: valuationSource,
      acquisition_method: acquisitionMethod,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const changes: Record<string, { old: string; new: string }> = {};

  if (oldItem.market_value_per_unit !== marketValuePerUnit) {
    changes.market_value_per_unit = {
      old: String(oldItem.market_value_per_unit),
      new: String(marketValuePerUnit),
    };
  }

  if ((oldItem.valuation_source || "") !== valuationSource) {
    changes.valuation_source = {
      old: oldItem.valuation_source || "",
      new: valuationSource,
    };
  }

  if ((oldItem.acquisition_method || "") !== acquisitionMethod) {
    changes.acquisition_method = {
      old: oldItem.acquisition_method || "",
      new: acquisitionMethod,
    };
  }

  if (Object.keys(changes).length > 0) {
    await logInventoryChange(
      "edited",
      userEmail,
      id,
      oldItem.item_description,
      changes
    );
  }
}

/* Delete item */
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

  if (error) throw new Error(error.message);

  await logInventoryChange("deleted", userEmail, id, item.item_description);
}

/* Update item quantity - archives if quantity reaches 0 */
export async function updateItemQuantity(
  id: number,
  newQuantity: number,
  userEmail: string
) {
  const { data: oldItem, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("quantity, item_description, active, market_value_per_unit, expiration")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const clampedQuantity = Math.max(0, newQuantity);

  const updates = {
    quantity: clampedQuantity,
    total_value: money2(clampedQuantity * oldItem.market_value_per_unit),
    active: clampedQuantity > 0,
    status: getInventoryStatus(clampedQuantity, oldItem.expiration),
  };

  const { error } = await supabaseServer
    .from("inventory")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logInventoryChange(
    newQuantity === 0 ? "archived" : "edited",
    userEmail,
    id,
    oldItem.item_description,
    {
      quantity: {
        old: String(oldItem.quantity),
        new: String(newQuantity),
      },
      ...(newQuantity === 0
        ? {
            active: {
              old: String(oldItem.active),
              new: "false",
            },
          }
        : {}),
    }
  );
}

/* Update item details */
export async function updateItemDetails(
  id: number,
  payload: UpdateItemDetailsPayload,
  userEmail: string
) {
  const { data: oldItem, error: fetchError } = await supabaseServer
    .from("inventory")
    .select(
      "manufacturer, reference_number, lot_number, unit_of_measure, typical_shelf_life, location, internal_notes, item_description, active"
    )
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );

  const { error } = await supabaseServer
    .from("inventory")
    .update(cleanPayload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  // SAFE CHANGE BUILDER (no undefined values allowed)
  const changes: Record<string, { old: string; new: string }> = {};

  if (payload.manufacturer !== undefined && payload.manufacturer !== oldItem.manufacturer) {
    changes.manufacturer = {
      old: oldItem.manufacturer || "",
      new: payload.manufacturer,
    };
  }

  if (
    payload.reference_number !== undefined &&
    payload.reference_number !== oldItem.reference_number
  ) {
    changes.reference_number = {
      old: oldItem.reference_number || "",
      new: payload.reference_number,
    };
  }

  if (payload.lot_number !== undefined && payload.lot_number !== oldItem.lot_number) {
    changes.lot_number = {
      old: oldItem.lot_number || "",
      new: payload.lot_number,
    };
  }

  if (
    payload.unit_of_measure !== undefined &&
    payload.unit_of_measure !== oldItem.unit_of_measure
  ) {
    changes.unit_of_measure = {
      old: oldItem.unit_of_measure || "",
      new: payload.unit_of_measure,
    };
  }

  if (
    payload.typical_shelf_life !== undefined &&
    payload.typical_shelf_life !== oldItem.typical_shelf_life
  ) {
    changes.typical_shelf_life = {
      old: oldItem.typical_shelf_life || "",
      new: payload.typical_shelf_life,
    };
  }

  if (payload.location !== undefined && payload.location !== oldItem.location) {
    changes.location = {
      old: oldItem.location || "",
      new: payload.location,
    };
  }

  if (
    payload.internal_notes !== undefined &&
    payload.internal_notes !== oldItem.internal_notes
  ) {
    changes.internal_notes = {
      old: oldItem.internal_notes || "",
      new: payload.internal_notes || "",
    };
  }
  if (payload.active !== undefined && payload.active !== oldItem.active) {
    changes.active = {
      old: String(oldItem.active),
      new: String(payload.active),
    };
  }

  if (Object.keys(changes).length > 0) {
    await logInventoryChange(
      "edited",
      userEmail,
      id,
      oldItem.item_description,
      changes
    );
  }
}

/* Add quantity to an existing item + record an inventory entry */
export async function addItemQuantity(
  id: number,
  quantityToAdd: number,
  notes: string,
  userEmail: string
) {
  // Fetch current item state
  const { data: oldItem, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("quantity, item_description, market_value_per_unit, active, expiration")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const newQuantity = Math.max(0, oldItem.quantity + quantityToAdd);
  const newTotalValue = money2(newQuantity * (oldItem.market_value_per_unit ?? 0));

  // Update inventory row
  const { error: updateError } = await supabaseServer
    .from("inventory")
    .update({
      quantity: newQuantity,
      total_value: newTotalValue,
      active: newQuantity > 0,
      status: getInventoryStatus(newQuantity, oldItem.expiration),
    })
    .eq("id", id);

  if (updateError) throw new Error(updateError.message);

  // Insert into inventory_entries table
  const { error: entryError } = await supabaseServer
    .from("inventory_entries")
    .insert({
      inventory_id: id,
      quantity_added: quantityToAdd,
      notes: notes || null,
      added_by: userEmail,
      date_added: new Date().toISOString().split("T")[0],
    });

  if (entryError) throw new Error(entryError.message);

  // Log to activity_log
  await logInventoryChange(
    "added",
    userEmail,
    id,
    oldItem.item_description,
    {
      quantity: {
        old: String(oldItem.quantity),
        new: String(newQuantity),
      },
    },
    quantityToAdd
  );
}

/* Fetch all inventory entries for a given item */
export async function fetchInventoryEntries(inventoryId: number) {
  const { data, error } = await supabaseServer
    .from("inventory_entries")
    .select("*")
    .eq("inventory_id", inventoryId)
    .order("date_added", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}