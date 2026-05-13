import { fetchAuditReport, type AuditLine } from "./actions";

function money(v: number): string {
  return `$${v.toFixed(2)}`;
}

function LineTable({ lines }: { lines: AuditLine[] }) {
  if (lines.length === 0) {
    return <p className="text-sm text-black">No records found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-gray-200 bg-white">
      <table className="w-full text-sm text-black">
        <thead className="bg-gray-50 text-left text-black">
          <tr>
            <th className="px-3 py-2 font-semibold">Item</th>
            <th className="px-3 py-2 font-semibold">Qty</th>
            <th className="px-3 py-2 font-semibold">Unit Value</th>
            <th className="px-3 py-2 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={`${line.label}-${idx}`} className="border-t border-gray-100">
              <td className="px-3 py-2 text-black">{line.label}</td>
              <td className="px-3 py-2 text-black">{line.quantity}</td>
              <td className="px-3 py-2 text-black">{money(line.unitValue)}</td>
              <td className="px-3 py-2 text-black">{money(line.totalValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AuditReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const sp = await searchParams;
  const nowYear = new Date().getFullYear();
  const year = Number(sp.year ?? nowYear);
  const safeYear = Number.isFinite(year) && year > 2000 && year < 3000 ? year : nowYear;
  const report = await fetchAuditReport(safeYear);

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-black">Audit Report</h1>
        <form method="get" className="flex items-center gap-2">
          <label className="text-sm text-black" htmlFor="year">
            Year
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={report.year}
            className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-black"
          />
          <button className="rounded bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white">
            Apply
          </button>
        </form>
      </div>

      <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black">1) Items Donated ({report.year})</h2>
        <LineTable lines={report.donated.lines} />
        <p className="text-sm font-semibold text-black">Total donated value: {money(report.donated.totalValue)}</p>
      </section>

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black">2) Items Used On Missions ({report.year})</h2>
        {report.usedByMission.missions.length === 0 ? (
          <p className="text-sm text-black">No mission usage records found.</p>
        ) : (
          report.usedByMission.missions.map((mission) => (
            <div key={mission.missionName} className="space-y-2 rounded border border-gray-100 p-3">
              <p className="font-medium text-black">{mission.missionName}</p>
              <LineTable lines={mission.lines} />
              <p className="text-sm font-semibold text-black">
                Mission total: {money(mission.totalValue)}
              </p>
            </div>
          ))
        )}
        <p className="text-sm font-semibold text-black">
          Grand total across missions: {money(report.usedByMission.totalValue)}
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black">3) Items Returned To Donor</h2>
        <LineTable lines={report.returned.lines} />
        <p className="text-sm font-semibold text-black">Total returned value: {money(report.returned.totalValue)}</p>
      </section>

      <section className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-black">4) Items Currently In Inventory</h2>
        <LineTable lines={report.currentInventory.lines} />
        <p className="text-sm font-semibold text-black">
          Current inventory total value: {money(report.currentInventory.totalValue)}
        </p>
      </section>
    </div>
  );
}
