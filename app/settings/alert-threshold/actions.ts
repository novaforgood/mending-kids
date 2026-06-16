"use server";

import { requireAdmin } from "@/lib/supabase/server-auth";
import { supabaseServer } from "@/lib/supabase/server";
import {
  DEFAULT_THRESHOLD_DAYS,
  MAX_THRESHOLD_DAYS,
  MIN_THRESHOLD_DAYS,
} from "./constants";

/**
 * Read the global expiration-alert threshold (in days). Items expiring within
 * this many days are considered alertable. Falls back to the default if the
 * settings row/table is missing so callers never crash on first run.
 */
export async function fetchAlertThresholdDays(): Promise<number> {
  const { data, error } = await supabaseServer
    .from("global_settings")
    .select("expiration_alert_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_THRESHOLD_DAYS;
  return data.expiration_alert_days ?? DEFAULT_THRESHOLD_DAYS;
}

/** Update the global expiration-alert threshold (admin only). */
export async function updateAlertThresholdDays(days: number): Promise<void> {
  await requireAdmin();

  const rounded = Math.round(days);
  if (!Number.isFinite(rounded) || rounded < MIN_THRESHOLD_DAYS || rounded > MAX_THRESHOLD_DAYS) {
    throw new Error(
      `Threshold must be between ${MIN_THRESHOLD_DAYS} and ${MAX_THRESHOLD_DAYS} days.`
    );
  }

  const { error } = await supabaseServer
    .from("global_settings")
    .upsert({ id: 1, expiration_alert_days: rounded, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
}
