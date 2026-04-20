"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  fetchMissionById,
  fetchMissionItems,
  fetchMissionMembers,
  fetchAllInventoryItems,
  addItemToMission,
  removeItemFromMission,
  updateMission,
  fetchMissionActivityLog,
  type MissionItem,
  type ActivityLogEntry,
} from "../actions";

type Mission = {
  id: number;
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
  status: string;
  description: string | null;
  doctor_name: string | null;
  budget: number | null;
};

type Member = {
  id: number;
  name: string;
  contact: string | null;
  form_filled: boolean;
  role: string | null;
  mission_id: number;
};

type InventoryOption = {
  id: number;
  item_description: string | null;
  manufacturer: string | null;
  reference_number: string | null;
  quantity: number;
  unit_of_measure: string | null;
  status: string | null;
  location: string | null;
};

type SortField = "item_description" | "manufacturer" | "allocated_quantity";
type SortDir = "asc" | "desc";

type EditForm = {
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
};

const CATEGORIES = ["ENT", "Surgical", "Medical", "Dental", "Orthopedic", "Educational", "Cardiac", "General"];

const CATEGORY_COLORS: Record<string, string> = {
  ENT: "#9b46f0",
  Surgical: "#0064d6",
  Medical: "#22863a",
  Dental: "#00818a",
  Orthopedic: "#c9372c",
  Educational: "#cd519d",
  Cardiac: "#e67e22",
  General: "#6c6f77",
};

function formatMissionDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${month}/${day}`;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={active ? "text-black" : "text-[#9ba7b8]"}>
      <path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity={active && dir === "asc" ? 1 : 0.4} />
      <path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity={active && dir === "desc" ? 1 : 0.4} />
    </svg>
  );
}

export default function MissionDetailPage() {
  const params = useParams();
  const missionId = Number(params.id);

  const [mission, setMission] = useState<Mission | null>(null);
  const [items, setItems] = useState<MissionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "people" | "documentation">("items");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Add Item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [allInventory, setAllInventory] = useState<InventoryOption[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [addQty, setAddQty] = useState(1);
  const [addSearch, setAddSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Edit Mission modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Documentation / activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);

  async function reloadItems() {
    const updated = await fetchMissionItems(missionId);
    setItems(updated);
  }

  useEffect(() => {
    async function load() {
      try {
        const [missionData, itemsData, membersData] = await Promise.all([
          fetchMissionById(missionId),
          fetchMissionItems(missionId),
          fetchMissionMembers(missionId),
        ]);
        setMission(missionData);
        setItems(itemsData);
        setMembers(membersData);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [missionId]);

  async function openAddModal() {
    setShowAddModal(true);
    setSelectedId("");
    setAddQty(1);
    setAddSearch("");
    setAddError(null);
    if (allInventory.length === 0) {
      setInventoryLoading(true);
      try {
        const inv = await fetchAllInventoryItems();
        setAllInventory(inv);
      } finally {
        setInventoryLoading(false);
      }
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) { setAddError("Please select an item."); return; }
    if (addQty < 1) { setAddError("Quantity must be at least 1."); return; }
    setAdding(true);
    setAddError(null);
    try {
      await addItemToMission(missionId, Number(selectedId), addQty);
      await reloadItems();
      setShowAddModal(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(missionItemId: number) {
    setRemovingId(missionItemId);
    try {
      await removeItemFromMission(missionItemId);
      await reloadItems();
    } finally {
      setRemovingId(null);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function openEditModal() {
    if (!mission) return;
    setEditForm({
      mission_name: mission.mission_name,
      start_date: mission.start_date,
      end_date: mission.end_date,
      location: mission.location,
      category: mission.category,
    });
    setEditError(null);
    setShowEditModal(true);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    if (!editForm.mission_name || !editForm.start_date || !editForm.end_date || !editForm.location) {
      setEditError("All fields are required.");
      return;
    }
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateMission(missionId, editForm);
      const updated = await fetchMissionById(missionId);
      setMission(updated);
      setShowEditModal(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update mission.");
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleTabChange(tab: "items" | "people" | "documentation") {
    setActiveTab(tab);
    if (tab === "documentation" && !logsLoaded) {
      setLogsLoading(true);
      try {
        const logs = await fetchMissionActivityLog(missionId);
        setActivityLogs(logs);
        setLogsLoaded(true);
      } finally {
        setLogsLoading(false);
      }
    }
  }

  const sortedItems = [...items].sort((a, b) => {
    if (!sortField) return 0;
    const av = a[sortField];
    const bv = b[sortField];
    const cmp = typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av ?? "").toLowerCase().localeCompare(String(bv ?? "").toLowerCase());
    return sortDir === "asc" ? cmp : -cmp;
  });

  const assignedIds = new Set(items.map((i) => i.inventory_id));

  const filteredInventory = allInventory.filter((inv) => {
    if (assignedIds.has(inv.id)) return false;
    if (!addSearch) return true;
    const q = addSearch.toLowerCase();
    return (
      inv.item_description?.toLowerCase().includes(q) ||
      inv.manufacturer?.toLowerCase().includes(q) ||
      inv.reference_number?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-8 text-[#6c6f77] text-[14px]">Loading mission…</div>;

  if (notFound || !mission) {
    return (
      <div className="p-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-[14px] text-[#44546f] hover:text-[#9b46f0] mb-4">
          ← Back to Missions
        </Link>
        <p className="text-[#6c6f77]">Mission not found.</p>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[mission.category] ?? "#6c6f77";
  const startFmt = formatMissionDate(mission.start_date);
  const endFmt = formatMissionDate(mission.end_date);

  const tabs = [
    { key: "items", label: `Items (${items.length})` },
    { key: "people", label: `People (${members.length})` },
    { key: "documentation", label: "Documentation" },
  ] as const;

  return (
    <div className="p-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-[14px] text-[#44546f] hover:text-[#9b46f0] transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Missions
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={openAddModal} className="inline-flex items-center gap-1 bg-[#9b46f0] text-white text-[14px] font-medium px-4 py-[6px] rounded hover:bg-[#8836e0] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Item
          </button>
          <button onClick={openEditModal} className="border border-[#8c8f97] text-[#44546f] text-[14px] font-medium px-4 py-[6px] rounded hover:bg-gray-50 transition-colors">
            Edit Mission
          </button>
          <button className="border border-[#8c8f97] text-[#6c6f77] text-[14px] px-[10px] py-[6px] rounded hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-[#6c6f77]">
              <circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title + badge */}
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-[24px] font-bold text-black leading-tight">{mission.mission_name}</h1>
        <span className="text-white text-[10px] font-medium px-2 py-1 rounded-full leading-[16px] whitespace-nowrap" style={{ backgroundColor: categoryColor }}>
          {mission.category}
        </span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[14px] text-[#44546f] mb-7">
        <span className="inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#44546f]">
            <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M1 5.5h12M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {startFmt} – {endFmt}
        </span>
        <span className="text-[#ccc]">•</span>
        <span className="inline-flex items-center gap-1">
          <svg width="10" height="14" viewBox="0 0 12 16" fill="none" className="shrink-0 text-[#44546f]">
            <path d="M6 0C2.686 0 0 2.686 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
          </svg>
          {mission.location}
        </span>
        <span className="text-[#ccc]">•</span>
        <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
        <span className="text-[#ccc]">•</span>
        <span>{members.length} {members.length === 1 ? "person" : "people"}</span>
        {mission.doctor_name && (
          <>
            <span className="text-[#ccc]">•</span>
            <span>{mission.doctor_name}</span>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {tabs.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => handleTabChange(key)}
            className={`pb-[10px] text-[14px] font-medium border-b-2 transition-colors ${activeTab === key ? "border-black text-black" : "border-transparent text-[#6c6f77] hover:text-black"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Items tab ── */}
      {activeTab === "items" && (
        <div className="border border-t-0 border-gray-200 rounded-b overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">
                  <button type="button" onClick={() => handleSort("item_description")} className="inline-flex items-center gap-1 hover:text-black transition-colors">
                    Item Description <SortIcon active={sortField === "item_description"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[180px]">
                  <button type="button" onClick={() => handleSort("manufacturer")} className="inline-flex items-center gap-1 hover:text-black transition-colors">
                    Manufacturer <SortIcon active={sortField === "manufacturer"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[150px]">Ref #</th>
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[120px]">
                  <button type="button" onClick={() => handleSort("allocated_quantity")} className="inline-flex items-center gap-1 hover:text-black transition-colors">
                    Qty (mission) <SortIcon active={sortField === "allocated_quantity"} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[110px]">In Stock</th>
                <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[90px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.mission_item_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-[10px] text-black font-medium">{item.item_description || "—"}</td>
                  <td className="px-4 py-[10px] text-[#44546f]">{item.manufacturer || "—"}</td>
                  <td className="px-4 py-[10px] text-[#44546f] text-[13px]">{item.reference_number || "—"}</td>
                  <td className="px-4 py-[10px]">
                    <span className="inline-flex items-center bg-[#f0f0f0] text-black text-[12px] font-medium px-2 py-[2px] rounded">
                      {item.allocated_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-[10px] text-[#44546f] text-[13px]">
                    {item.quantity ?? "—"} {item.unit_of_measure ?? ""}
                  </td>
                  <td className="px-4 py-[10px]">
                    <button
                      onClick={() => handleRemove(item.mission_item_id)}
                      disabled={removingId === item.mission_item_id}
                      className="p-[6px] text-[#c9372c] hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                      title="Remove from mission"
                    >
                      <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
                        <path d="M2 3.5h9M5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M5.5 6v4M7.5 6v4M3 3.5l.5 7a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6c6f77]">
                    No items in this mission —{" "}
                    <button onClick={openAddModal} className="text-[#9b46f0] hover:underline">add one</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── People tab ── */}
      {activeTab === "people" && (
        <div className="border border-t-0 border-gray-200 rounded-b overflow-hidden">
          {members.length === 0 ? (
            <div className="py-12 text-center text-[#6c6f77]">No team members recorded</div>
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">Name</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">Role</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">Contact</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">Form</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-[10px] text-black font-medium">{m.name}</td>
                    <td className="px-4 py-[10px] text-[#44546f]">{m.role || "—"}</td>
                    <td className="px-4 py-[10px] text-[#44546f]">{m.contact || "—"}</td>
                    <td className="px-4 py-[10px]">
                      <span className={`inline-flex items-center text-[11px] font-medium px-2 py-[2px] rounded ${m.form_filled ? "bg-green-100 text-green-800" : "bg-gray-100 text-[#6c6f77]"}`}>
                        {m.form_filled ? "Filled" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "documentation" && (
        <div className="border border-t-0 border-gray-200 rounded-b overflow-hidden">
          {logsLoading ? (
            <div className="py-12 text-center text-[#6c6f77] text-[14px]">Loading logs…</div>
          ) : activityLogs.length === 0 ? (
            <div className="py-12 text-center text-[#6c6f77] text-[14px]">No activity recorded for this mission</div>
          ) : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[140px]">Date</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[160px]">Action</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f] w-[160px]">Performed By</th>
                  <th className="text-left px-4 py-[10px] font-medium text-[#44546f]">Description</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-[10px] text-[#44546f] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-[10px] text-black font-medium">{log.action_type}</td>
                    <td className="px-4 py-[10px] text-[#44546f]">{log.performed_by}</td>
                    <td className="px-4 py-[10px] text-[#44546f]">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Edit Mission Modal ── */}
      {showEditModal && editForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-black">Edit Mission</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#6c6f77] hover:text-black text-[20px] leading-none p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSave} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">Mission Name</label>
                <input
                  type="text"
                  value={editForm.mission_name}
                  onChange={(e) => setEditForm((f) => f ? { ...f, mission_name: e.target.value } : f)}
                  placeholder="e.g. Tanzania 2025"
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#44546f] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm((f) => f ? { ...f, start_date: e.target.value } : f)}
                    className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#44546f] mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm((f) => f ? { ...f, end_date: e.target.value } : f)}
                    className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => f ? { ...f, location: e.target.value } : f)}
                  placeholder="e.g. Dar es Salaam"
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">Specialty</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => f ? { ...f, category: e.target.value } : f)}
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black bg-white focus:outline-none focus:border-[#9b46f0]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {editError && <p className="text-[13px] text-[#c9372c]">{editError}</p>}

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="border border-[#8c8f97] text-[#44546f] text-[14px] font-medium px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="bg-[#9b46f0] text-white text-[14px] font-medium px-4 py-2 rounded hover:bg-[#8836e0] transition-colors disabled:opacity-60"
                >
                  {editSubmitting ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Item Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="bg-white rounded-lg shadow-xl w-[540px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200">
              <h2 className="text-[17px] font-bold text-black">Add Item to Mission</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6c6f77] hover:text-black text-[20px] leading-none p-1">×</button>
            </div>

            <form onSubmit={handleAddItem} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 pt-4 pb-3">
                <input type="text" placeholder="Search items…" value={addSearch}
                  onChange={(e) => { setAddSearch(e.target.value); setSelectedId(""); }}
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] focus:outline-none focus:border-[#9b46f0]" />
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-2">
                {inventoryLoading ? (
                  <p className="text-[14px] text-[#6c6f77] py-4 text-center">Loading inventory…</p>
                ) : filteredInventory.length === 0 ? (
                  <p className="text-[14px] text-[#6c6f77] py-4 text-center">
                    {addSearch ? "No matching items" : "All items already assigned to this mission"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filteredInventory.map((inv) => (
                      <label key={inv.id}
                        className={`flex items-center gap-3 px-3 py-[10px] rounded cursor-pointer border transition-colors ${selectedId === inv.id ? "border-[#9b46f0] bg-purple-50" : "border-transparent hover:bg-gray-50"}`}>
                        <input type="radio" name="inv_item" value={inv.id} checked={selectedId === inv.id}
                          onChange={() => setSelectedId(inv.id)} className="accent-[#9b46f0]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-black truncate">{inv.item_description || `Item #${inv.id}`}</p>
                          <p className="text-[12px] text-[#6c6f77]">
                            {inv.manufacturer ?? "Unknown"}{inv.reference_number ? ` · ${inv.reference_number}` : ""}
                            {inv.location ? ` · ${inv.location}` : ""}
                          </p>
                        </div>
                        <span className="text-[12px] text-[#44546f] shrink-0">{inv.quantity} {inv.unit_of_measure ?? "units"} in stock</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
                <label className="text-[13px] font-medium text-[#44546f] whitespace-nowrap">Qty for mission</label>
                <input type="number" min={1} value={addQty} onChange={(e) => setAddQty(Math.max(1, Number(e.target.value)))}
                  className="w-[70px] border border-[#8c8f97] rounded px-2 py-[6px] text-[14px] text-center focus:outline-none focus:border-[#9b46f0]" />
                {addError && <p className="flex-1 text-[13px] text-[#c9372c]">{addError}</p>}
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="border border-[#8c8f97] text-[#44546f] text-[14px] font-medium px-4 py-2 rounded hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={adding || !selectedId}
                    className="bg-[#9b46f0] text-white text-[14px] font-medium px-4 py-2 rounded hover:bg-[#8836e0] transition-colors disabled:opacity-60">
                    {adding ? "Adding…" : "Add to Mission"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
