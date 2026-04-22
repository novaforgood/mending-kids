"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMissionItem } from "../../actions";

type InventoryItem = {
  id: number;
  item_description: string | null;
  manufacturer: string | null;
  reference_number: string | null;
  expiration_date: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
};

type Props = {
  missionId: number;
  inventory: InventoryItem[];
};

const CATEGORIES = ["ENT", "Medical", "Dental", "Surgical", "Educational", "Other"];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export default function AddItemsClient({ missionId, inventory }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({}); // id → qty
  const [saving, setSaving] = useState(false);

  const selectedCount = Object.keys(selected).length;

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.item_description?.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q) ||
      item.reference_number?.toLowerCase().includes(q);
    // Category filter: match against item_description as a rough proxy
    const matchesCategory =
      !categoryFilter ||
      item.item_description?.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: number, qty: number) => {
    setSelected((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const incrementQty = (id: number) => {
    setSelected((prev) => {
      if (id in prev) return { ...prev, [id]: prev[id] + 1 };
      return { ...prev, [id]: 1 };
    });
  };

  const handleSubmit = async () => {
    if (selectedCount === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(selected).map(([inventoryId, qty]) =>
          addMissionItem({
            mission_id: missionId,
            inventory_id: Number(inventoryId),
            quantity: qty,
          })
        )
      );
      router.push(`/missions/${missionId}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const selectedItems = inventory.filter((item) => item.id in selected);

  // ── Step 2: Confirmation ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <h1 className="text-xl font-bold text-gray-900">Review Selected Items</h1>
            <Link
              href={`/missions/${missionId}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Link>
          </div>

          {/* Confirmation table */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">Item Description</th>
                  <th className="py-3 pr-4">Manufacturer</th>
                  <th className="py-3 pr-4">Reference Number</th>
                  <th className="py-3 pr-4">Available Qty</th>
                  <th className="py-3">Qty to Add</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-gray-900">{item.item_description ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{item.manufacturer ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{item.reference_number ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.quantity != null
                        ? `${item.quantity}${item.unit_of_measure ? ` ${item.unit_of_measure}` : ""}`
                        : "—"}
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                        {selected[item.id]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              onClick={() => setStep(1)}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded bg-indigo-700 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
            >
              {saving ? "Adding…" : `Add ${selectedCount} Item${selectedCount > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Selection ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Add Items to Mission</h1>
          <Link
            href={`/missions/${missionId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by description, manufacturer, or reference number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-300 py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === null
                ? "bg-indigo-700 text-white"
                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-indigo-700 text-white"
                  : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Selected items table */}
        {selectedCount > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Selected Items</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-500">
                  <th className="w-10 py-2 pr-2">Select</th>
                  <th className="py-2 pr-4">Item Description</th>
                  <th className="py-2 pr-4">Manufacturing Company</th>
                  <th className="py-2 pr-4">Reference Number</th>
                  <th className="py-2 pr-4">Quantity</th>
                  <th className="py-2">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 cursor-pointer accent-indigo-700"
                      />
                    </td>
                    <td className="py-2 pr-4 text-gray-900">{item.item_description ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{item.manufacturer ?? "—"}</td>
                    <td className="py-2 pr-4 text-gray-600">{item.reference_number ?? "—"}</td>
                    <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        min={1}
                        value={selected[item.id]}
                        onChange={(e) => setQty(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 rounded border border-gray-300 px-2 py-0.5 text-center text-sm text-gray-900 outline-none focus:border-indigo-500"
                      />
                    </td>
                    <td className="py-2 text-gray-600">{formatDate(item.expiration_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory table */}
        <div className="overflow-x-auto">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">All Inventory</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="w-10 py-3 pr-2">Select</th>
                <th className="py-3 pr-4">Item Description</th>
                <th className="py-3 pr-4">Manufacturing Company</th>
                <th className="py-3 pr-4">Reference Number</th>
                <th className="py-3 pr-4">Quantity</th>
                <th className="py-3">Expiration</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading inventory…
                  </td>
                </tr>
              )}
              {inventory.length > 0 && filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No items match your search
                  </td>
                </tr>
              )}
              {filteredInventory.map((item) => {
                const isChecked = item.id in selected;
                return (
                  <tr
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                      isChecked ? "bg-indigo-50" : ""
                    }`}
                  >
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer accent-indigo-700"
                      />
                    </td>
                    <td className="py-3 pr-4 text-gray-900">
                      {item.item_description ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{item.manufacturer ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">{item.reference_number ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {item.quantity != null
                        ? `${item.quantity}${item.unit_of_measure ? ` ${item.unit_of_measure}` : ""}`
                        : "—"}
                    </td>
                    <td className="py-3 text-gray-600">{formatDate(item.expiration_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <Link
            href={`/missions/${missionId}`}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            onClick={() => setStep(2)}
            disabled={selectedCount === 0}
            className="rounded bg-indigo-700 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-40"
          >
            Next → ({selectedCount} item{selectedCount !== 1 ? "s" : ""})
          </button>
        </div>
      </div>
    </div>
  );
}
