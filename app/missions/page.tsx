"use client";

import { useEffect, useState } from "react";
import { fetchMissions } from "./actions";
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
  team_members: string | null;
  mission_inventory: { count: number }[];
};

const BADGE: Record<string, { bg: string; text: string }> = {
  Medical:     { bg: "#e3fcef", text: "#006644" },
  Dental:      { bg: "#e6f0ff", text: "#0052cc" },
  Surgical:    { bg: "#fff0b3", text: "#974900" },
  Educational: { bg: "#f3f0ff", text: "#403294" },
  Other:       { bg: "#f4f5f7", text: "#42526e" },
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  return `${parseInt(m)}/${parseInt(d)}/${y.slice(2)}`;
}

function MissionCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
  const startFmt = formatDate(mission.start_date);
  const endFmt = formatDate(mission.end_date);
  const dateRange = [startFmt, endFmt].filter(Boolean).join(" – ");

  const badge = mission.category ? (BADGE[mission.category] ?? BADGE.Other) : null;

  const itemCount = mission.mission_inventory?.[0]?.count ?? 0;
  const memberCount = mission.team_members
    ? mission.team_members.split(",").map((s) => s.trim()).filter(Boolean).length
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow relative flex flex-col gap-0"
      style={{ border: "1px solid rgba(11,18,40,0.08)" }}
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

      {/* Mission name */}
      <h2 className="font-bold text-[17px] text-[#051524] mb-3 pr-24 leading-snug">
        {mission.mission_name}
      </h2>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{mission.location ?? "No location"}</span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{dateRange || "No dates set"}</span>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-3 flex items-center gap-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span>{itemCount} items</span>
        </div>
        <div className="flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{memberCount} members</span>
        </div>
        <button
          className="ml-auto text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
          onClick={(e) => e.stopPropagation()}
          title="More options"
        >
          ···
        </button>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function loadMissions() {
    try {
      const data = await fetchMissions();
      setMissions(data as Mission[]);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-8">
      <AddMissionPanel
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          loadMissions();
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#051524]">Missions</h1>
        <button
          onClick={() => setIsAddOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Create Mission
        </button>
      </div>

      {/* Card grid */}
      {missions.length === 0 ? (
        <p className="text-center text-gray-400 mt-20">No missions yet. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClick={() => router.push(`/missions/${mission.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
