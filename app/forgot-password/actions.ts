"use server";

import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Make sure an account exists for `email` before a reset email is sent.
 *
 * Reachable from the public /forgot-password page, so it self-registers a
 * brand-new email as an `intern` (least privilege) with a confirmed email and
 * a random throwaway password. The caller then triggers the normal recovery
 * email, so the user lands on /reset-password and picks their own password.
 *
 * An email that already has an account is left untouched — the recovery email
 * still goes out through the existing flow.
 */
export async function ensureAccountForReset(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);

  if (!email) throw new Error("Please enter an email address.");
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");

  const { error } = await supabaseServer.auth.admin.createUser({
    email,
    // Throwaway: the user never sees or uses this; they set a real one via the
    // recovery link. Two UUIDs keep it well above the 6-char minimum.
    password: `${randomUUID()}${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      role: "intern",
      full_name: "Intern User",
    },
  });

  // Already-registered means the account exists — nothing to create, and the
  // recovery email still goes out for them. Any other error is real.
  if (error && !/already.*registered|already.*exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}
