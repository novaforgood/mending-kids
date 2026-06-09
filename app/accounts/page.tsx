"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRequireAdmin } from "@/app/hooks/useRequireAdmin";
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  type AccountRole,
  type AccountRow,
} from "./actions";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountsPage() {
  const { loading, authorized } = useRequireAdmin();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("intern");
  const [filter, setFilter] = useState<"all" | "admin" | "intern">("all");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      loadAccounts();
    }
  }, [authorized, loadAccounts]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await createAccount({ email, password, role, fullName });
      setEmail("");
      setFullName("");
      setPassword("");
      setRole("intern");
      setMessage({ type: "success", text: "Account created." });
      await loadAccounts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create account.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (account: AccountRow) => {
    if (!window.confirm(`Delete the account for ${account.email}? This cannot be undone.`)) return;

    setMessage(null);
    try {
      await deleteAccount(account.id);
      setMessage({ type: "success", text: "Account deleted." });
      await loadAccounts();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete account.",
      });
    }
  };

  if (loading) return <main style={{ padding: "40px" }}>Loading...</main>;
  if (!authorized) return null;

  const filteredAccounts =
    filter === "all" ? accounts : accounts.filter((a) => a.role === filter);

  const filterOptions: { value: typeof filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "admin", label: "Admins" },
    { value: "intern", label: "Interns" },
  ];

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Manage Accounts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and delete user accounts. New accounts can sign in immediately.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-3 mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-64 rounded border border-gray-300 px-2 py-1 text-sm text-black"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm text-black"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm text-black"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AccountRole)}
              className="w-32 rounded border border-gray-300 px-2 py-1 text-sm text-black bg-white"
            >
              <option value="intern">Intern</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        {message && (
          <p
            className={`text-sm mb-4 ${message.type === "success" ? "text-green-700" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}

        <div className="flex items-center gap-1 mb-3" role="group" aria-label="Filter accounts by role">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1 text-sm rounded border ${
                filter === opt.value
                  ? "bg-indigo-700 text-white border-indigo-700"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Created</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{row.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.full_name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap capitalize">{row.role}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="text-sm text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredAccounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
