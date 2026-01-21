"use client";

import { useEffect, useState } from "react";
import { fetchMissions, addMission, updateMission } from "./actions";

type Mission = {
  id: number;
  created_at: string;
  mission_name: string;
  equipment: string;
  quantity: number;  // Add this
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionName, setMissionName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [quantity, setQuantity] = useState<number>(1);  // Add this
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
        await updateMission(editingId, missionName, equipment, quantity);  // Add quantity
      } else {
        await addMission(missionName, equipment, quantity);  // Add quantity
      }
      setMissionName("");
      setEquipment("");
      setQuantity(1);  // Add this
      setEditingId(null);
      loadMissions();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">Missions</h1>

        {/* Form */}
        <div className="mb-6 flex gap-3">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Mission Name"
            value={missionName}
            onChange={(e) => setMissionName(e.target.value)}
          />
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="Equipment Needed"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
          <input
            type="number"
            className="w-32 rounded border px-3 py-2"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
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
              <tr className="bg-gray-200 text-left">
                <th className="p-2">ID</th>
                <th className="p-2">Created</th>
                <th className="p-2">Mission Name</th>
                <th className="p-2">Equipment</th>
                <th className="p-2">Quantity</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {missions.map((mission) => (
                <tr key={mission.id} className="border-t">
                  <td className="p-2">{mission.id}</td>
                  <td className="p-2 text-sm text-gray-500">
                    {new Date(mission.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{mission.mission_name}</td>
                  <td className="p-2">{mission.equipment}</td>
                  <td className="p-2">{mission.quantity}</td>  {/* Add this */}
                  <td className="p-2">
                    <button
                      onClick={() => {
                        setEditingId(mission.id);
                        setMissionName(mission.mission_name);
                        setEquipment(mission.equipment);
                        setQuantity(mission.quantity);  // Add this
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {missions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">  {/* Change 5 to 6 */}
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