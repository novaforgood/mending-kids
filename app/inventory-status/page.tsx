"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAlertItems } from "../alerts/actions";

type InventoryRow = {
  id: number;
  manufacturer: string;
  item_description: string | null;
  reference_number: string;
  quantity: number;
  unit: string | null;
  unit_of_measure: string | null;
  alert_threshold: number | null;
  expiration: string | null;
  active: boolean;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function getInventoryStatus(row: InventoryRow): {
  label: string;
  badgeClass: string;
  priority: number;
} {
  const now = new Date();
  if (row.expiration && new Date(row.expiration) < now) {
    return { label: "EXPIRED", badgeClass: "bg-red-100 text-red-800", priority: 0 };
  }
  if (row.alert_threshold != null && row.quantity < row.alert_threshold) {
    return { label: "LOW STOCK", badgeClass: "bg-yellow-100 text-yellow-800", priority: 1 };
  }
  return { label: "IN STOCK", badgeClass: "bg-blue-100 text-blue-800", priority: 2 };
}

export default function InventoryStatusPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);

  useEffect(() => {
    async function loadRows() {
      try {
        const data = await fetchAlertItems();
        setRows(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadRows();
  }, []);

  const orderedRows = [...rows]
    .filter((row) => row.active)
    .sort((a, b) => {
    const statusDiff = getInventoryStatus(a).priority - getInventoryStatus(b).priority;
    if (statusDiff !== 0) return statusDiff;
    return (a.reference_number ?? "").localeCompare(b.reference_number ?? "");
  });

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Inventory Status</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">Item</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Manufacturer</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Reference</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Threshold</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Expiration</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {orderedRows.map((row) => {
                  const status = getInventoryStatus(row);
                  return (
                    <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{row.item_description ?? "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.manufacturer}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.reference_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.quantity} {row.unit ?? row.unit_of_measure ?? ""}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.alert_threshold ?? "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.expiration)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`${status.badgeClass} text-xs px-2 py-1 rounded`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}

                {orderedRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No inventory items found
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
