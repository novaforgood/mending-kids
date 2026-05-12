"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMissions, updateMission, deleteMission } from "./actions";
import { useRouter } from "next/navigation";
import AddMissionPanel from "./AddMissionPanel";

type Mission = {
  id: number;
  created_at: string;
  mission_name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  status: string | null;
  mission_inventory: { count: number }[];
  memberCount: number;
};

const BADGE: Record<string, { bg: string; text: string }> = {
  ENT:         { bg: "#7c3aed", text: "#ffffff" },
  Medical:     { bg: "#057a55", text: "#ffffff" },
  Dental:      { bg: "#1a56db", text: "#ffffff" },
  Surgical:    { bg: "#b45309", text: "#ffffff" },
  Educational: { bg: "#5521b5", text: "#ffffff" },
  Other:       { bg: "#374151", text: "#ffffff" },
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`;
}

function MenuOption({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "8px 16px",
        fontSize: 14,
        color: danger ? "#DC2626" : "#111827",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = danger ? "#FEF2F2" : "#F9FAFB")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLButtonElement).style.background = "none")
      }
    >
      {label}
    </button>
  );
}

function MissionCard({
  mission,
  tab,
  onClick,
  onArchive,
  onRestore,
  onDelete,
}: {
  mission: Mission;
  tab: "current" | "archive";
  onClick: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const startFmt = formatDate(mission.start_date);
  const endFmt = formatDate(mission.end_date);
  const dateRange = [startFmt, endFmt].filter(Boolean).join(" – ");

  const badge = mission.category ? (BADGE[mission.category] ?? BADGE.Other) : null;

  const itemCount = mission.mission_inventory?.[0]?.count ?? 0;
  const memberCount = mission.memberCount ?? 0;

  return (
    <div
      onClick={onClick}
      className="bg-white cursor-pointer hover:shadow-md transition-shadow relative flex flex-col justify-between p-5"
      style={{
        height: 150,
        border: "1px solid #8C8F97",
        borderRadius: 8,
        boxSizing: "border-box",
      }}
    >
      {/* Category badge */}
      {badge && mission.category && (
        <span
          className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {mission.category}
        </span>
      )}

      {/* Top section */}
      <div>
        {/* Mission name */}
        <h2 className="font-bold text-[17px] text-[#051524] pr-20 leading-snug truncate">
          {mission.mission_name}
        </h2>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{mission.location ?? "No location"}</span>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{dateRange || "No dates set"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {itemCount} items{" "}
          <span className="mx-1">·</span>
          {memberCount} people
        </span>
        <div ref={menuRef} className="relative">
          <button
            className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            title="More options"
          >
            ···
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                right: 0,
                bottom: "calc(100% + 4px)",
                zIndex: 10,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: 140,
                padding: "4px 0",
              }}
            >
              {tab === "current" && (
                <>
                  <MenuOption label="View"    onClick={() => { setMenuOpen(false); onClick(); }} />
                  <MenuOption label="Edit"    onClick={() => { setMenuOpen(false); onClick(); }} />
                  <MenuOption label="Archive" onClick={() => { setMenuOpen(false); onArchive(); }} />
                </>
              )}
              {tab === "archive" && (
                <MenuOption label="Restore" onClick={() => { setMenuOpen(false); onRestore(); }} />
              )}
              <MenuOption label="Delete" onClick={() => { setMenuOpen(false); onDelete(); }} danger />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "archive">("current");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  async function loadMissions() {
    try {
      const data = await fetchMissions();
      setMissions(data as Mission[]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleArchive(id: number) {
    try { await updateMission(id, { status: "archived" }); await loadMissions(); }
    catch (err) { console.error(err); }
  }

  async function handleRestore(id: number) {
    try { await updateMission(id, { status: "active" }); await loadMissions(); }
    catch (err) { console.error(err); }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Permanently delete this mission? This cannot be undone.")) return;
    try { await deleteMission(id); await loadMissions(); }
    catch (err) { console.error(err); }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const tabFiltered = missions.filter((m) => {
    const manuallyArchived = m.status === "archived";
    const restored = m.status === "active";
    const pastEndDate = !!m.end_date && m.end_date < today;
    const goesToArchive = manuallyArchived || (!restored && pastEndDate);
    return activeTab === "archive" ? goesToArchive : !goesToArchive;
  });

  const displayed = tabFiltered.filter((m) => {
    if (selectedCategory && m.category !== selectedCategory) return false;
    if (selectedLocation && m.location !== selectedLocation) return false;
    if (searchQuery && !m.mission_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(missions.map((m) => m.category).filter(Boolean))] as string[];
  const locations = [...new Set(missions.map((m) => m.location).filter(Boolean))] as string[];

  function switchTab(tab: "current" | "archive") {
    setActiveTab(tab);
    setSelectedCategory("");
    setSelectedLocation("");
    setSearchQuery("");
  }

  const emptyMessage =
    activeTab === "archive"
      ? "No archived missions."
      : missions.length === 0
      ? "No missions yet. Create your first one!"
      : "No missions match the selected filters.";

  const selectStyle: React.CSSProperties = {
    appearance: "none",
    WebkitAppearance: "none",
    border: "1px solid #D0D5DD",
    borderRadius: 6,
    padding: "6px 28px 6px 10px",
    fontSize: 13,
    color: "#374151",
    background: `#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 8px center`,
    cursor: "pointer",
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <AddMissionPanel
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          loadMissions();
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#051524]">Missions</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#1E1B4B", fontSize: 14, lineHeight: "20px" }}
          >
            Create Mission
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-lg leading-none"
            title="More options"
          >
            ···
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(["current", "archive"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className="pb-2 text-sm capitalize transition-colors"
            style={{
              borderBottom: activeTab === tab ? "2px solid #051524" : "2px solid transparent",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#051524" : "#6B7280",
              marginBottom: -1,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="">Specialty</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            style={selectStyle}
          >
            <option value="">Location</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "1px solid #7C3AED",
              borderRadius: 6,
              padding: "6px 12px 6px 32px",
              fontSize: 13,
              color: "#374151",
              width: 220,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Card grid */}
      {displayed.length === 0 ? (
        <p className="text-center text-gray-400 mt-20">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              tab={activeTab}
              onClick={() => router.push(`/missions/${mission.id}`)}
              onArchive={() => handleArchive(mission.id)}
              onRestore={() => handleRestore(mission.id)}
              onDelete={() => handleDelete(mission.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
