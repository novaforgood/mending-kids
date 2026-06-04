"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRequireAdmin } from "@/app/hooks/useRequireAdmin";
import {
  addNotifiedEmail,
  fetchNotifiedEmails,
  removeNotifiedEmail,
  type NotifiedEmailRow,
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

export default function SettingsPage() {
  const { loading, authorized } = useRequireAdmin();
  const [emails, setEmails] = useState<NotifiedEmailRow[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadEmails = useCallback(async () => {
    try {
      const data = await fetchNotifiedEmails();
      setEmails(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      loadEmails();
    }
  }, [authorized, loadEmails]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      await addNotifiedEmail(newEmail);
      setNewEmail("");
      setMessage({ type: "success", text: "Email added." });
      await loadEmails();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add email.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Remove ${email} from notification list?`)) return;

    setMessage(null);
    try {
      await removeNotifiedEmail(email);
      setMessage({ type: "success", text: "Email removed." });
      await loadEmails();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove email.",
      });
    }
  };

  if (loading) return <main style={{ padding: "40px" }}>Loading...</main>;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Notification Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              These addresses receive daily inventory alert emails.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-6">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            required
            className="w-64 rounded border border-gray-300 px-2 py-1 text-sm text-black"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add email"}
          </button>
        </form>

        {message && (
          <p
            className={`text-sm mb-4 ${message.type === "success" ? "text-green-700" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Added</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((row) => (
                  <tr key={row.email} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{row.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.email)}
                        className="text-sm text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {emails.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      No notification emails configured
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
