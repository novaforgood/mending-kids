import { supabaseServer } from "@/lib/supabase/server";

export type ChangeType = "added" | "edited" | "deleted";

export type ChangeLogEntry = {
  timestamp: string;
  type: ChangeType;
  user: string;
  itemId?: number;
  itemDescription?: string;
  changes?: Record<string, { old: string; new: string }>;
};

export async function logInventoryChange(
  type: ChangeType,
  user: string,
  itemId?: number,
  itemDescription?: string,
  changes?: Record<string, { old: string; new: string }>
) {
  // Build description from changes if provided
  let description = itemDescription || "";
  if (changes) {
    const changeDescriptions = Object.entries(changes).map(
      ([field, { old: oldVal, new: newVal }]) => `${field}: "${oldVal}" → "${newVal}"`
    );
    description += changeDescriptions.length > 0 
      ? ` (${changeDescriptions.join(", ")})`
      : "";
  }

  const { error } = await supabaseServer
    .from("activity_log")
    .insert({
      action_type: type,
      performed_by: user,
      description: description,
      item_name: itemDescription,
      inventory_id: itemId,
    });

  if (error) {
    console.error("Failed to log inventory change:", error.message);
  }
}