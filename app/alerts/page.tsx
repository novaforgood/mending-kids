"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlertItems } from "./actions";
import { fetchAlertThresholdDays } from "../settings/alert-threshold/actions";

type Row = {
  id: number;
  created_at: string;
  product: string;
  quantity: number;
  alert_threshold: number;
  expiration: string | null;
  active: boolean;
};

type Filter = "all" | "expiration" | "low-stock";

export default function AlertsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [alertThresholdDays, setAlertThresholdDays] = useState(180);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAlertItems();
        setRows(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadThreshold() {
      try {
        const value = await fetchAlertThresholdDays();
        setAlertThresholdDays(value);
      } catch (err) {
        console.error(err);
      }
    }
    loadThreshold();
  }, []);

  // Low stock items: quantity < alert_threshold
  const lowStockItems = rows
    .filter((row) => row.quantity < row.alert_threshold)
    .sort((a, b) => a.quantity / a.alert_threshold - b.quantity / b.alert_threshold);

  // Expiration items: has expiration date and expires within the global threshold window
  const now = new Date();
  const expirationCutoff = new Date(now);
  expirationCutoff.setDate(expirationCutoff.getDate() + alertThresholdDays);

  const expirationItems = rows
    .filter((row) => {
      if (!row.active) return false;
      if (!row.expiration) return false;
      const expDate = new Date(row.expiration);
      return expDate <= expirationCutoff;
    })
    .sort((a, b) => {
      const dateA = new Date(a.expiration!);
      const dateB = new Date(b.expiration!);
      return dateA.getTime() - dateB.getTime();
    });

  function getStockColor(quantity: number, threshold: number): string {
    const ratio = quantity / threshold;
    if (ratio < 0.25) return "bg-red-500";
    if (ratio < 0.5) return "bg-orange-500";
    return "bg-yellow-400";
  }

  function getExpirationInfo(expirationDate: string): {
    text: string;
    priority: string;
    borderColor: string;
    textColor: string;
  } {
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (diffDays < 0) {
      return { priority: "HIGH PRIORITY", borderColor: "border-red-500", textColor: "text-red-600", text: "expired" };
    } else if (diffDays <= 60) {
      // Within 2 months - high priority
      if (diffMonths > 0) {
        return { priority: "HIGH PRIORITY", borderColor: "border-red-500", textColor: "text-red-600", text: `expire in ${diffMonths} month${diffMonths > 1 ? "s" : ""}, ${remainingDays} days` };
      }
      return { priority: "HIGH PRIORITY", borderColor: "border-red-500", textColor: "text-red-600", text: `expire in ${diffDays} days` };
    } else {
      // More than 2 months - medium priority
      return { priority: "MEDIUM PRIORITY", borderColor: "border-yellow-500", textColor: "text-yellow-600", text: `expire in ${diffMonths} months, ${remainingDays} days` };
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  }

  const showLowStock = filter === "all" || filter === "low-stock";
  const showExpiration = filter === "all" || filter === "expiration";

  const tabs: { label: string; value: Filter }[] = [
    { label: "All Alerts", value: "all" },
    { label: "Expiration Alerts", value: "expiration" },
    { label: "Low Stock Alerts", value: "low-stock" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-[550px] h-[600px] bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-gray-200 text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Alert Items */}
        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {/* Low-stock items */}
          {showLowStock && lowStockItems.map((item) => (
            <div key={`stock-${item.id}`} className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">{item.product}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-sm">{item.quantity}/{item.alert_threshold}</span>
                  <Link href="/kian-test-table" className="text-gray-400 text-lg hover:text-gray-600">→</Link>
                </div>
              </div>
              <div className="mt-2 h-3 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStockColor(item.quantity, item.alert_threshold)} rounded-full`}
                  style={{ width: `${(item.quantity / item.alert_threshold) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Expiration items */}
          {showExpiration && expirationItems.map((item) => {
            const { text, priority, borderColor, textColor } = getExpirationInfo(item.expiration!);
            return (
              <div key={`exp-${item.id}`} className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`border ${borderColor} ${textColor} text-xs font-bold px-2 py-1 rounded whitespace-nowrap`}>
                      {priority}
                    </span>
                    <span className="text-gray-700">
                      {item.quantity} {item.product} {text} ({formatDate(item.expiration!)})
                    </span>
                  </div>
                  <Link href="/kian-test-table" className="text-gray-400 text-lg hover:text-gray-600">→</Link>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {showLowStock && lowStockItems.length === 0 && showExpiration && expirationItems.length === 0 && (
            <div className="text-gray-500 text-center py-4">No alerts</div>
          )}
          {filter === "low-stock" && lowStockItems.length === 0 && (
            <div className="text-gray-500 text-center py-4">No low-stock alerts</div>
          )}
          {filter === "expiration" && expirationItems.length === 0 && (
            <div className="text-gray-500 text-center py-4">No expiration alerts</div>
          )}
        </div>
      </div>
    </div>
  );
}
