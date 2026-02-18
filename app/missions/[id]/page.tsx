import { fetchMissionDetail } from "../actions";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;        // ✅ this is the key fix
  const missionId = Number(id);

  if (!Number.isInteger(missionId)) {
    return <div className="text-black">Invalid mission id: {String(id)}</div>;
  }

  const { mission, items } = await fetchMissionDetail(missionId);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-black">{mission.mission_name}</h1>

            {mission.category && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-black">
                {mission.category}
              </span>
            )}

            {mission.status && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-black">
                {mission.status}
              </span>
            )}
          </div>

          <div className="mt-2 text-sm text-black">
            {mission.start_date ?? "—"} – {mission.end_date ?? "—"} •{" "}
            {mission.location ?? "—"}
          </div>

          <div className="mt-1 text-sm text-black">
            {items.length} items
          </div>
        </div>

        {/* Items table */}
        <h2 className="mb-2 font-semibold text-black">Items</h2>
        <div className="overflow-x-auto rounded border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-black">
                <th className="p-2">Item Description</th>
                <th className="p-2">Manufacturing Company</th>
                <th className="p-2">Reference #</th>
                <th className="p-2">Quantity Used</th>
              </tr>
            </thead>

            <tbody>
              {items.map((row: any) => (
                <tr key={row.id} className="border-t text-sm text-black">
                  <td className="p-2">
                    {row.inventory?.item_description ?? "—"}
                  </td>
                  <td className="p-2">
                    {row.inventory?.manufacturer ?? "—"}
                  </td>
                  <td className="p-2">
                    {row.inventory?.reference_number ?? "—"}
                  </td>
                  <td className="p-2">{row.quantity_used ?? 0}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-black">
                    No items for this mission yet
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