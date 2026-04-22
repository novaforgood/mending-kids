"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAllActivityLog } from "../dashboard/actions";
import { DateFilter, DateFilterDropdown, isWithinDateFilter } from "./DateFilterDropdown";

type InventoryLog = {
  id: number;
  created_at: string;
  action_type: string;
  performed_by: string;
  description: string;
  item_name: string | null;
  quantity: number | null;
  mission_id: number | null;
  inventory_id: number | null;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await fetchAllActivityLog();
        setLogs(data);
      } catch (error) {
        console.error(error);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!isWithinDateFilter(log.created_at, dateFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(q) ||
      log.performed_by.toLowerCase().includes(q) ||
      log.description.toLowerCase().includes(q) ||
      (log.item_name ?? "").toLowerCase().includes(q)
    );
  });

  const hasFilters = !!searchQuery.trim() || !!dateFilter;

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Inventory Logs</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Action</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Performed By</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Item</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Qty</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap uppercase">{log.action_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.performed_by}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.item_name ?? "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.quantity ?? "-"}</td>
                    <td className="px-4 py-3">{log.description}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {hasFilters ? "No logs match your filters" : "No inventory logs found"}
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
