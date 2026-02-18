"use client";

import { useEffect, useState } from "react";
import { fetchMissions, addMission, updateMission } from "./actions";
import { useRouter } from "next/navigation";


type Mission = {
  id: number;
  created_at: string;
  mission_name: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  category: string | null;
  status: string | null;
};

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionName, setMissionName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadMissions() {
    try {
      const data = await fetchMissions();
      setMissions(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadMissions();
  }, []);

  async function handleSubmit() {
    if (!missionName) return;
    try {
      if (editingId) {
        await updateMission(editingId, { mission_name: missionName });
      } else {
        await addMission({
          mission_name: missionName,
          start_date: null,
          end_date: null,
          location: "",
          category: "",
          status: "planned",
        });
      }
      setMissionName("");
      setEditingId(null);
      loadMissions();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold text-black">Missions</h1>

        {/* Form */}
        <div className="mb-6 flex gap-3">
          <input
            className="flex-1 rounded border px-3 py-2 text-gray-800"
            placeholder="Mission Name"
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left text-black">
                <th className="p-2">ID</th>
                <th className="p-2">Created</th>
                <th className="p-2">Mission Name</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id} className="border-t text-black">
                  <td className="p-2">{mission.id}</td>
                  <td className="p-2 text-sm text-black">
                    {new Date(mission.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{mission.mission_name}</td>
                  <td className="p-2">
                    <button
                      onClick={() => router.push(`/missions/${mission.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {missions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-black">
                    No missions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}