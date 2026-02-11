"use client";

import { useEffect, useState } from "react";
import { fetchMissionInventory } from "./actions";

type MissionInventoryRow = {
  id: number;
  mission_id: number;
  inventory_id: number;
  quantity_used: number | null;
  missions: { mission_name: string }[] | null;
};

export default function MissionInventoryPage() {
  const [rows, setRows] = useState<MissionInventoryRow[]>([]);

  useEffect(() => {
    fetchMissionInventory().then(setRows).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Mission Inventory</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-gray-900">
                {row.missions?.mission_name ?? `Mission #${row.mission_id}`}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Inventory #{row.inventory_id}
                {row.quantity_used != null && ` · Qty: ${row.quantity_used}`}
              </p>
            </div>
          ))}
        </div>
        {rows.length === 0 && (
          <p className="text-gray-500">No mission inventory entries yet.</p>
        )}
      </div>
    </div>
  );
}