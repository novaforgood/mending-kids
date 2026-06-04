"use server";

import { requireAdmin } from "@/lib/supabase/server-auth";
import { supabaseServer } from "@/lib/supabase/server";

export type NotifiedEmailRow = {
  email: string;
  created_at: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function fetchNotifiedEmails(): Promise<NotifiedEmailRow[]> {
  await requireAdmin();

  const { data, error } = await supabaseServer
    .from("notified_emails")
    .select("email, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addNotifiedEmail(email: string): Promise<void> {
  await requireAdmin();

  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Please enter an email address.");
  if (!isValidEmail(normalized)) throw new Error("Please enter a valid email address.");

  const { error } = await supabaseServer.from("notified_emails").insert({ email: normalized });

  if (error) {
    if (error.code === "23505") throw new Error("Email already in list.");
    throw new Error(error.message);
  }
}

export async function removeNotifiedEmail(email: string): Promise<void> {
  await requireAdmin();

  const { error } = await supabaseServer
    .from("notified_emails")
    .delete()
    .eq("email", email);

  if (error) throw new Error(error.message);
}
