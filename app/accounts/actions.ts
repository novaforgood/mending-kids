"use server";

import { requireAdmin } from "@/lib/supabase/server-auth";
import { supabaseServer } from "@/lib/supabase/server";

export type AccountRow = {
  id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
};

export type AccountRole = "admin" | "intern";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function fetchAccounts(): Promise<AccountRow[]> {
  await requireAdmin();

  // The admin API paginates (50 users/page by default); walk every page so the
  // list stays complete as the team grows.
  const accounts: AccountRow[] = [];
  let page = 1;

  for (;;) {
    const { data, error } = await supabaseServer.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);

    for (const user of data.users) {
      accounts.push({
        id: user.id,
        email: user.email ?? "",
        role: (user.user_metadata?.role as string) ?? "—",
        full_name: (user.user_metadata?.full_name as string) ?? "",
        created_at: user.created_at,
      });
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  accounts.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return accounts;
}

export async function createAccount(input: {
  email: string;
  password: string;
  role: AccountRole;
  fullName: string;
}): Promise<void> {
  await requireAdmin();

  const email = normalizeEmail(input.email);
  const fullName = input.fullName.trim();
  const role = input.role;

  if (!email) throw new Error("Please enter an email address.");
  if (!isValidEmail(email)) throw new Error("Please enter a valid email address.");
  if (!input.password || input.password.length < 6)
    throw new Error("Password must be at least 6 characters.");
  if (role !== "admin" && role !== "intern")
    throw new Error("Role must be 'admin' or 'intern'.");

  const { error } = await supabaseServer.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: fullName || (role === "admin" ? "Admin User" : "Intern User"),
    },
  });

  if (error) {
    if (/already.*registered|already.*exists/i.test(error.message))
      throw new Error("An account with this email already exists.");
    throw new Error(error.message);
  }
}

export async function deleteAccount(userId: string): Promise<void> {
  const currentUser = await requireAdmin();

  if (!userId) throw new Error("Missing user id.");
  if (userId === currentUser.id)
    throw new Error("You cannot delete your own account.");

  const { error } = await supabaseServer.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
