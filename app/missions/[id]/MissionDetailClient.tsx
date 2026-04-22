"use client";

import { useState } from "react";
import Link from "next/link";
import AddMemberPanel from "./AddMemberPanel";
import EditMissionPanel from "./EditMissionPanel";
import { updateMissionItem } from "../actions";

type InventoryItem = {
  id: number;
  item_description?: string;
  manufacturer?: string;
  reference_number?: string;
  quantity?: number;
  unit_of_measure?: string;
};

type MissionItem = {
  id: number;
  quantity_used: number;
  inventory: InventoryItem | null;
};

type Mission = {
  id: number;
  mission_name: string;
  category?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
};

type MissionMember = {
  id: number;
  name?: string | null;
  contact?: string | null;
  form_filled?: boolean | null;
  role?: string | null;
};

type Props = {
  mission: Mission;
  items: MissionItem[];
  members: MissionMember[];
};

const CATEGORY_COLORS: Record<string, string> = {
  ENT: "bg-green-100 text-green-800",
  Medical: "bg-blue-100 text-blue-800",
  Dental: "bg-purple-100 text-purple-800",
  Surgical: "bg-red-100 text-red-800",
  Educational: "bg-yellow-100 text-yellow-800",
};

function getCategoryAbbr(category: string) {
  const map: Record<string, string> = {
    ENT: "ENT",
    Medical: "MED",
    Dental: "DEN",
    Surgical: "SURG",
    Educational: "EDU",
    Other: "OTH",
  };
  return map[category] ?? category.slice(0, 3).toUpperCase();
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return null;
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  if (start) return fmt(start);
  return fmt(end!);
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

function ItemsTab({ items }: { items: MissionItem[] }) {
  const [quantities, setQuantities] = useState<Record<number, number>>(
    Object.fromEntries(items.map((r) => [r.id, r.quantity_used ?? 0]))
  );

  const handleIncrement = async (id: number) => {
    const next = (quantities[id] ?? 0) + 1;
    setQuantities((prev) => ({ ...prev, [id]: next }));
    try {
      await updateMissionItem(id, next);
    } catch (err) {
      console.error(err);
      setQuantities((prev) => ({ ...prev, [id]: next - 1 }));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-white text-left text-gray-600">
            <th className="py-3 pr-4 font-medium">
              Item Description{" "}
              <span className="text-gray-400">⇅</span>
            </th>
            <th className="py-3 pr-4 font-medium">
              Manufacturing Company{" "}
              <span className="text-gray-400">⇅</span>
            </th>
            <th className="py-3 pr-4 font-medium">
              Reference Number{" "}
              <span className="text-gray-400">⇅</span>
            </th>
            <th className="py-3 pr-4 font-medium">
              Quantity{" "}
              <span className="text-gray-400">⇅</span>
            </th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 pr-4 text-gray-900">
                {row.inventory?.item_description ?? "—"}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {row.inventory?.manufacturer ?? "—"}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {row.inventory?.reference_number ?? "—"}
              </td>
              <td className="py-3 pr-4">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                  {quantities[row.id] ?? 0}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className="rounded border border-gray-400 px-2 py-0.5 text-xs text-gray-600">
                  LABEL
                </span>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleIncrement(row.id)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                  >
                    +
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">
                    ✏️
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">
                    ···
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                No items for this mission yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PeopleTab({
  members,
  missionId,
}: {
  members: MissionMember[];
  missionId: number;
}) {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = members.filter((m) =>
    (m.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AddMemberPanel
        isOpen={drawerOpen}
        missionId={missionId}
        onClose={() => setDrawerOpen(false)}
        onAdded={() => window.location.reload()}
      />

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="outline-none"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Member
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">Name <span className="text-gray-400">⇅</span></th>
              <th className="py-3 pr-4 font-medium">Contact <span className="text-gray-400">⇅</span></th>
              <th className="py-3 pr-4 font-medium">Form Filled <span className="text-gray-400">⇅</span></th>
              <th className="py-3 pr-4 font-medium">Role</th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 text-gray-900">{m.name ?? "—"}</td>
                <td className="py-3 pr-4 text-gray-600">{m.contact ?? "—"}</td>
                <td className="py-3 pr-4">
                  <input type="checkbox" readOnly checked={m.form_filled ?? false} className="h-4 w-4" />
                </td>
                <td className="py-3 pr-4">
                  {m.role ? (
                    <span className="rounded border border-gray-400 px-2 py-0.5 text-xs font-medium uppercase text-gray-600">
                      {m.role}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">✏️</button>
                    <button className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">···</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  {search ? "No members match your search" : "No people added to this mission yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentationTab() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input className="outline-none" placeholder="Search" />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">
            ≡
          </button>
        </div>
        <button className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          + Add Document
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">
                Name <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">
                Upload Date <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">
                Uploaded by <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="py-12 text-center text-gray-400">
                No documents added to this mission yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Tab = "items" | "people" | "documentation";

export default function MissionDetailClient({ mission, items, members }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [editMissionOpen, setEditMissionOpen] = useState(false);

  const dateRange = formatDateRange(mission.start_date, mission.end_date);
  const categoryColor =
    CATEGORY_COLORS[mission.category ?? ""] ?? "bg-gray-100 text-gray-700";
  const categoryAbbr = mission.category
    ? getCategoryAbbr(mission.category)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <EditMissionPanel
        isOpen={editMissionOpen}
        missionId={mission.id}
        onClose={() => setEditMissionOpen(false)}
        onSaved={() => window.location.reload()}
      />

      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow-sm">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/missions"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Missions
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/missions/${mission.id}/add-items`}
              className="flex items-center gap-1 rounded bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              + Add Item
            </Link>
            <button
              onClick={() => setEditMissionOpen(true)}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit Mission
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">
              ···
            </button>
          </div>
        </div>

        {/* Mission header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {mission.mission_name}
            </h1>
            {categoryAbbr && (
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${categoryColor}`}
              >
                {categoryAbbr}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {dateRange && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dateRange}
              </span>
            )}
            {mission.location && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {mission.location}
              </span>
            )}
            <span className="text-gray-400">{items.length} items</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-6">
            {(["items", "people", "documentation"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === "items" && <ItemsTab items={items} />}
        {activeTab === "people" && <PeopleTab members={members} missionId={mission.id} />}
        {activeTab === "documentation" && <DocumentationTab />}
      </div>
    </div>
  );
}
