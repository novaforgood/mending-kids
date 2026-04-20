"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMissions, createMission } from "./actions";

type Mission = {
  id: number;
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
  status: string;
  item_count: number;
  member_count: number;
};

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

const CATEGORIES = ["ENT", "Surgical", "Medical", "Dental", "Orthopedic", "Educational", "Cardiac", "General"];

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#6c6f77";
}

function formatMissionDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${month}/${day}`;
}

function isDateOverdue(mission: Mission): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(mission.end_date + "T00:00:00");
  return endDate < today && mission.status.toLowerCase() !== "completed";
}

type CreateForm = {
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
};

const EMPTY_FORM: CreateForm = {
  mission_name: "",
  start_date: "",
  end_date: "",
  location: "",
  category: "ENT",
};

export default function DashboardPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activeTab, setActiveTab] = useState<"current" | "archive">("current");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMissions().then(setMissions).catch(console.error);
  }, []);

  const filteredMissions = missions
    .filter((m) =>
      activeTab === "archive"
        ? m.status.toLowerCase() === "completed"
        : m.status.toLowerCase() !== "completed"
    )
    .filter((m) => !specialtyFilter || m.category === specialtyFilter)
    .filter((m) => !locationFilter || m.location === locationFilter)
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return m.mission_name.toLowerCase().includes(q) || m.location.toLowerCase().includes(q);
    });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.mission_name || !form.start_date || !form.end_date || !form.location) {
      setFormError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await createMission(form);
      const updated = await fetchMissions();
      setMissions(updated);
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create mission.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  return (
    <div className="p-8">
      {/* Page header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-black leading-tight">Missions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#9b46f0] text-white text-[14px] px-4 py-[7px] rounded font-medium hover:bg-[#8836e0] transition-colors"
          >
            Create Mission
          </button>
          <button className="text-[#6c6f77] text-[20px] leading-none px-2 hover:bg-gray-100 rounded">
            •••
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={`pb-[10px] text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === "current"
              ? "border-black text-black"
              : "border-transparent text-[#6c6f77] hover:text-black"
          }`}
        >
          Current
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archive")}
          className={`pb-[10px] text-[14px] font-medium border-b-2 transition-colors ${
            activeTab === "archive"
              ? "border-black text-black"
              : "border-transparent text-[#6c6f77] hover:text-black"
          }`}
        >
          Archive
        </button>
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1">
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="border border-[#8c8f97] rounded px-3 py-[6px] text-[14px] text-[#44546f] bg-white appearance-none pr-8 cursor-pointer"
            >
              <option value="">Specialty</option>
              {Array.from(new Set(missions.map((m) => m.category))).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {specialtyFilter && (
              <button
                onClick={() => setSpecialtyFilter("")}
                className="text-[#6c6f77] hover:text-black text-[18px] leading-none px-1"
                title="Clear specialty filter"
              >
                ×
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-[#8c8f97] rounded px-3 py-[6px] text-[14px] text-[#44546f] bg-white appearance-none pr-8 cursor-pointer"
            >
              <option value="">Location</option>
              {Array.from(new Set(missions.map((m) => m.location))).map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            {locationFilter && (
              <button
                onClick={() => setLocationFilter("")}
                className="text-[#6c6f77] hover:text-black text-[18px] leading-none px-1"
                title="Clear location filter"
              >
                ×
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Missions"
            className="border border-[#8c8f97] rounded px-3 py-[6px] text-[14px] text-[#6c6f77] w-[200px] focus:outline-none focus:border-[#9b46f0]"
          />
          <button className="border border-[#8c8f97] rounded px-4 py-[6px] text-[14px] text-[#44546f] flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <div className="w-[14px] h-[14px] relative shrink-0">
              <img
                src="https://www.figma.com/api/mcp/asset/22a6d49b-75d3-4b49-81ca-7cf27b8421f9"
                alt=""
                className="absolute inset-0 w-full h-full"
              />
            </div>
            Search
          </button>
        </div>
      </div>

      {/* Mission cards grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredMissions.map((mission) => {
          const overdue = isDateOverdue(mission);
          const categoryColor = getCategoryColor(mission.category);
          const startFmt = formatMissionDate(mission.start_date);
          const endFmt = formatMissionDate(mission.end_date);

          return (
            <Link
              key={mission.id}
              href={`/dashboard/${mission.id}`}
              className="block relative bg-white border border-[#8c8f97] rounded-[8px] overflow-hidden hover:shadow-sm transition-shadow"
              style={{ height: "150px" }}
            >
              {/* Mission name + category badge */}
              <div className="absolute left-[19px] right-[19px] top-[15px] flex items-start justify-between gap-2">
                <span className="font-bold text-[16px] text-black leading-[20px] truncate">
                  {mission.mission_name}
                </span>
                <span
                  className="shrink-0 text-white text-[10px] font-medium px-2 py-[4px] rounded-full leading-[16px] whitespace-nowrap"
                  style={{ backgroundColor: categoryColor }}
                >
                  {mission.category}
                </span>
              </div>

              {/* Location */}
              <div className="absolute left-[19px] top-[44px] flex items-center gap-2">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="none" className="shrink-0 text-[#44546f]">
                  <path d="M6 0C2.686 0 0 2.686 0 6c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
                </svg>
                <span className="text-[12px] text-black font-medium">{mission.location}</span>
              </div>

              {/* Date range */}
              <div className="absolute left-[19px] top-[72px] flex items-center gap-2">
                <div className="w-[16px] h-[16px] relative shrink-0">
                  <img
                    src="https://www.figma.com/api/mcp/asset/c82661ad-b2b4-4444-b2cc-b2ca8ca58a15"
                    alt=""
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <span
                  className="text-[12px] font-medium"
                  style={{ color: overdue ? "#c9372c" : "black" }}
                >
                  {startFmt} - {endFmt}
                </span>
              </div>

              {/* Bottom metadata + more options */}
              <div className="absolute left-[19px] bottom-[15px] flex items-center gap-[6px]">
                <span className="text-[12px] text-[#838383]">{mission.item_count} item{mission.item_count !== 1 ? "s" : ""}</span>
                <div className="w-[2px] h-[2px] rounded-full bg-[#838383] shrink-0" />
                <span className="text-[12px] text-[#838383]">{mission.member_count} {mission.member_count === 1 ? "person" : "people"}</span>
              </div>
              {/* Stop propagation so the ··· button doesn't trigger navigation */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="absolute bottom-[11px] right-[15px] p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-[#6c6f77]">
                  <circle cx="3" cy="8" r="1.5" />
                  <circle cx="8" cy="8" r="1.5" />
                  <circle cx="13" cy="8" r="1.5" />
                </svg>
              </button>
            </Link>
          );
        })}

        {filteredMissions.length === 0 && (
          <div className="col-span-3 text-center text-[#6c6f77] py-12">
            No missions found
          </div>
        )}
      </div>

      {/* Create Mission Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-black">Create Mission</h2>
              <button
                onClick={closeModal}
                className="text-[#6c6f77] hover:text-black text-[20px] leading-none p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">
                  Mission Name
                </label>
                <input
                  type="text"
                  value={form.mission_name}
                  onChange={(e) => setForm((f) => ({ ...f, mission_name: e.target.value }))}
                  placeholder="e.g. Tanzania 2025"
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#44546f] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#44546f] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Dar es Salaam"
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black focus:outline-none focus:border-[#9b46f0]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#44546f] mb-1">
                  Specialty
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-[#8c8f97] rounded px-3 py-2 text-[14px] text-black bg-white focus:outline-none focus:border-[#9b46f0]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="text-[13px] text-[#c9372c]">{formError}</p>
              )}

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-[#8c8f97] text-[#44546f] text-[14px] font-medium px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#9b46f0] text-white text-[14px] font-medium px-4 py-2 rounded hover:bg-[#8836e0] transition-colors disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create Mission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
