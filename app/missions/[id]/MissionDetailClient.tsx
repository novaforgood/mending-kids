"use client";

import { useState } from "react";
import Link from "next/link";
import AddMemberPanel from "./AddMemberPanel";
import EditMemberPanel from "./EditMemberPanel";
import EditMissionPanel from "./EditMissionPanel";
import EditMissionItemPanel from "./EditMissionItemPanel";
import AddDocumentPanel, { type DocumentEntry } from "./AddDocumentPanel";
import { updateMissionItem, updateMissionItemBag, updateMissionItemStatus, deleteMissionMember, deleteMissionItem } from "../actions";
import { overlayStyle, popupStyle } from "../panelStyles";
import { useAuthUser } from "@/app/hooks/authUser";

type InventoryItem = {
  id: number;
  item_description?: string;
  manufacturer?: string;
  reference_number?: string;
  quantity?: number;
  unit_of_measure?: string;
};

type ItemStatus = "TO RETURN" | "RETURNED" | "USED";

type MissionItem = {
  id: number;
  quantity_used: number;
  bag_number?: number | null;
  status?: ItemStatus | null;
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
  phone?: string | null;
  form_filled?: boolean | null;
  role?: string | null;
};

type Props = {
  mission: Mission;
  items: MissionItem[];
  members: MissionMember[];
  documents: DocumentEntry[];
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

function ItemsTab({ items, isArchived }: { items: MissionItem[]; isArchived: boolean }) {
  const [localItems, setLocalItems] = useState<MissionItem[]>(items);
  const [bagFilter, setBagFilter] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<MissionItem | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useAuthUser();

  const updateItem = (id: number, patch: Partial<MissionItem>) =>
    setLocalItems((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  const assignedBags = Array.from(
    new Set(localItems.map((r) => r.bag_number).filter((b): b is number => b != null))
  ).sort((a, b) => a - b);

  const visibleItems = bagFilter === null
    ? localItems
    : localItems.filter((row) => row.bag_number === bagFilter);

  const handleIncrement = async (id: number) => {
    const item = localItems.find((r) => r.id === id);
    if (!item) return;
    const next = (item.quantity_used ?? 0) + 1;

    if (user?.user_metadata?.role !== "admin") {
      setPopupMessage("You do not have permission to update items.");
      setShowPopup(true);
      return;
    }

    updateItem(id, { quantity_used: next });
    try {
      await updateMissionItem(id, next);
    } catch (err: any) {
      setPopupMessage(err.message || "You do not have permission to update items.");
      setShowPopup(true);
      updateItem(id, { quantity_used: next - 1 });
    }
  };

  return (
    <>
      <EditMissionItemPanel
        isOpen={editingItem !== null}
        item={editingItem}
        isArchived={isArchived}
        onClose={() => setEditingItem(null)}
        onSaved={(updated) => {
          updateItem(updated.id, updated);
          setEditingItem(null);
        }}
      />

      {/* Bag filter chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Filter by bag:</span>
        <button
          onClick={() => setBagFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            bagFilter === null
              ? "bg-indigo-700 text-white"
              : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {assignedBags.map((bag) => (
          <button
            key={bag}
            onClick={() => setBagFilter(bagFilter === bag ? null : bag)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              bagFilter === bag
                ? "bg-indigo-700 text-white"
                : "border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Bag {bag}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">
                Item Description <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">
                Manufacturing Company <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">
                Reference Number <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">
                Quantity <span className="text-gray-400">⇅</span>
              </th>
              <th className="py-3 pr-4 font-medium">Bag</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((row) => (
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
                    {row.quantity_used ?? 0}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="number"
                    min={1}
                    placeholder="—"
                    value={row.bag_number ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : parseInt(e.target.value);
                      updateItem(row.id, { bag_number: val });
                    }}
                    onBlur={() => {
                      updateMissionItemBag(row.id, row.bag_number ?? null).catch(console.error);
                    }}
                    className="w-16 rounded border border-gray-300 px-2 py-0.5 text-center text-sm text-gray-900 outline-none focus:border-indigo-500"
                  />
                </td>
                <td className="py-3 pr-4">
                  <select
                    value={row.status ?? ""}
                    disabled={!isArchived}
                    onChange={(e) => {
                      const val = e.target.value as ItemStatus | "";
                      updateItem(row.id, { status: val || null });
                      updateMissionItemStatus(row.id, val || null).catch(console.error);
                    }}
                    className={`rounded border px-2 py-0.5 text-xs font-medium outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                      row.status === "TO RETURN"
                        ? "border-red-300 bg-red-100 text-red-700"
                        : row.status === "RETURNED"
                        ? "border-green-300 bg-green-100 text-green-700"
                        : row.status === "USED"
                        ? "border-yellow-300 bg-yellow-100 text-yellow-700"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    <option value="">STATUS</option>
                    <option value="TO RETURN">TO RETURN</option>
                    <option value="RETURNED">RETURNED</option>
                    <option value="USED">USED</option>
                  </select>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIncrement(row.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setEditingItem(row)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100"
                      title="Edit item"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Remove this item from the mission?")) return;
                        await deleteMissionItem(row.id);
                        setLocalItems((prev) => prev.filter((r) => r.id !== row.id));
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-red-400 hover:bg-red-50"
                      title="Remove item"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">
                  {bagFilter !== null ? `No items assigned to Bag ${bagFilter}` : "No items for this mission yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPopup && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p>{popupMessage}</p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </>
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
  const [localMembers, setLocalMembers] = useState<MissionMember[]>(members);
  const [editingMember, setEditingMember] = useState<MissionMember | null>(null);

  const filtered = localMembers.filter((m) =>
    (m.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AddMemberPanel
        isOpen={drawerOpen}
        missionId={missionId}
        onClose={() => setDrawerOpen(false)}
        onAdded={(newMember) => {
          setLocalMembers((prev) => [...prev, newMember]);
          setDrawerOpen(false);
        }}
      />
      <EditMemberPanel
        isOpen={editingMember !== null}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSaved={(updated) => {
          setLocalMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          setEditingMember(null);
        }}
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
              <th className="py-3 pr-4 font-medium">Phone <span className="text-gray-400">⇅</span></th>
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
                <td className="py-3 pr-4 text-gray-600">{m.phone ?? "—"}</td>
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
                    <button onClick={() => setEditingMember(m)} className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100">✏️</button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove ${m.name ?? "this member"}?`)) return;
                        await deleteMissionMember(m.id);
                        setLocalMembers((prev) => prev.filter((x) => x.id !== m.id));
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-red-400 hover:bg-red-50"
                      title="Delete member"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
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

function DocumentationTab({ missionId, initialDocs }: { missionId: number; initialDocs: DocumentEntry[] }) {
  const [docs, setDocs] = useState<DocumentEntry[]>(initialDocs);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(docId: string) {
    if (!confirm("Remove this document?")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/missions/${missionId}/documents`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Delete failed");
      }
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = docs.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  return (
    <div>
      <AddDocumentPanel
        isOpen={drawerOpen}
        missionId={missionId}
        onClose={() => setDrawerOpen(false)}
        onAdded={(doc) => { setDocs((prev) => [...prev, doc]); setDrawerOpen(false); }}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="outline-none" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add Document
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left text-gray-600">
              <th className="py-3 pr-4 font-medium">Name <span className="text-gray-400">⇅</span></th>
              <th className="py-3 pr-4 font-medium">Type</th>
              <th className="py-3 pr-4 font-medium">Upload Date <span className="text-gray-400">⇅</span></th>
              <th className="py-3 pr-4 font-medium">Uploaded by <span className="text-gray-400">⇅</span></th>
              <th className="py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc) => (
              <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 text-gray-900">
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {doc.name}
                    </a>
                  ) : doc.name}
                </td>
                <td className="py-3 pr-4 text-gray-600">{doc.type}</td>
                <td className="py-3 pr-4 text-gray-600">{formatDate(doc.created_at)}</td>
                <td className="py-3 pr-4 text-gray-600">{doc.uploaded_by}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {doc.url && (
                      <a href={doc.url} download={doc.name} className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100" title="Download">
                        ↓
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-red-400 hover:bg-red-50 disabled:opacity-40"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  {search ? "No documents match your search" : "No documents added to this mission yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Tab = "items" | "people" | "documentation";

export default function MissionDetailClient({ mission, items, members, documents }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [editMissionOpen, setEditMissionOpen] = useState(false);
  const [localMission, setLocalMission] = useState(mission);

  const dateRange = formatDateRange(localMission.start_date, localMission.end_date);
  const categoryColor =
    CATEGORY_COLORS[localMission.category ?? ""] ?? "bg-gray-100 text-gray-700";
  const categoryAbbr = localMission.category
    ? getCategoryAbbr(localMission.category)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <EditMissionPanel
        isOpen={editMissionOpen}
        missionId={localMission.id}
        onClose={() => setEditMissionOpen(false)}
        onSaved={(patch) => setLocalMission((prev) => ({ ...prev, ...patch }))}
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
            <a
              href={`/api/missions/${mission.id}/export?format=csv`}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export CSV
            </a>
            <a
              href={`/api/missions/${mission.id}/export?format=pdf`}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Export PDF
            </a>
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
              {localMission.mission_name}
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
            {localMission.location && (
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {localMission.location}
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
        {activeTab === "items" && (
          <ItemsTab
            items={items}
            isArchived={
              mission.status === "archived" ||
              (mission.status !== "active" && !!mission.end_date && mission.end_date < new Date().toISOString().split("T")[0])
            }
          />
        )}
        {activeTab === "people" && <PeopleTab members={members} missionId={mission.id} />}
        {activeTab === "documentation" && <DocumentationTab missionId={mission.id} initialDocs={documents} />}
      </div>
    </div>
  );
}
