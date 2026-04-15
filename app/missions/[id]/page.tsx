import { fetchMissionDetail, fetchMissionMembers } from "../actions";
import MissionDetailClient from "./MissionDetailClient";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const missionId = Number(id);

  if (!Number.isInteger(missionId)) {
    return <div className="p-8 text-gray-700">Invalid mission id: {String(id)}</div>;
  }

  // Fetch mission details and members in parallel
  const [{ mission, items }, members] = await Promise.all([
    fetchMissionDetail(missionId),
    fetchMissionMembers(missionId),
  ]);

  return (
    <MissionDetailClient
      mission={mission}
      items={items as any}
      members={members}
    />
  );
}
