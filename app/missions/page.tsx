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

function MissionCard({ mission, onClick }: { mission: Mission; onClick: () => void }) {
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
        <button
          className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
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
    <div className="min-h-screen bg-white p-8">
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          style={{ fontFamily: "'Atlassian Sans', sans-serif", fontSize: 14, lineHeight: "20px" }}
        >
          Create Mission
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
