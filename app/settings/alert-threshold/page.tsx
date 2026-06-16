"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAdmin } from "@/app/hooks/useRequireAdmin";
import {
  DEFAULT_THRESHOLD_DAYS,
  MAX_THRESHOLD_DAYS,
  MIN_THRESHOLD_DAYS,
} from "./constants";
import { fetchAlertThresholdDays, updateAlertThresholdDays } from "./actions";

function formatDuration(days: number): string {
  if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  const monthLabel = `${months} month${months === 1 ? "" : "s"}`;
  if (remDays === 0) return monthLabel;
  return `${monthLabel}, ${remDays} day${remDays === 1 ? "" : "s"}`;
}

export default function AlertThresholdPage() {
  const { loading, authorized } = useRequireAdmin();
  const [days, setDays] = useState(DEFAULT_THRESHOLD_DAYS);
  const [savedDays, setSavedDays] = useState(DEFAULT_THRESHOLD_DAYS);
  const [loadingValue, setLoadingValue] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    async function load() {
      try {
        const value = await fetchAlertThresholdDays();
        if (!cancelled) {
          setDays(value);
          setSavedDays(value);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingValue(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const handleSave = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      await updateAlertThresholdDays(days);
      setSavedDays(days);
      setMessage({ type: "success", text: "Alert threshold saved." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save threshold.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main style={{ padding: "40px" }}>Loading...</main>;
  if (!authorized) return null;

  const dirty = days !== savedDays;

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Alert Threshold</h1>
            <p className="text-sm text-gray-600 mt-1">
              Items expiring within this window trigger expiration alerts and notification
              emails.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="threshold" className="text-sm font-medium text-gray-700">
              Expiration alert window
            </label>
            <span className="text-lg font-semibold text-indigo-700">{formatDuration(days)}</span>
          </div>

          <input
            id="threshold"
            type="range"
            min={MIN_THRESHOLD_DAYS}
            max={MAX_THRESHOLD_DAYS}
            step={1}
            value={days}
            disabled={loadingValue}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full accent-indigo-700 disabled:opacity-50"
          />

          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>1 day</span>
            <span>6 months</span>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Alert when an item expires within <span className="font-medium">{formatDuration(days)}</span>.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || loadingValue || !dirty}
              className="rounded bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
            {dirty && !submitting && (
              <button
                type="button"
                onClick={() => setDays(savedDays)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
            )}
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${
                message.type === "success" ? "text-green-700" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
