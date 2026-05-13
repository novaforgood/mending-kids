"use server";

import { supabaseServer } from "@/lib/supabase/server";

type InventoryRow = {
  id: number;
  created_at: string;
  item_description: string | null;
  reference_number: string | null;
  quantity: number | null;
  market_value_per_unit: number | null;
  status: string | null;
  acquisition_method: string | null;
};

type JoinedMission = { mission_name: string | null; start_date: string | null };
type JoinedInventory = {
  item_description: string | null;
  market_value_per_unit: number | null;
};

type MissionUsageRow = {
  quantity_used: number | null;
  missions: JoinedMission | JoinedMission[] | null;
  inventory: JoinedInventory | JoinedInventory[] | null;
};

function pickOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export type AuditLine = {
  label: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
};

export type MissionUsageSummary = {
  missionName: string;
  lines: AuditLine[];
  totalValue: number;
};

export type AuditReportData = {
  year: number;
  donated: { lines: AuditLine[]; totalValue: number };
  usedByMission: { missions: MissionUsageSummary[]; totalValue: number };
  returned: { lines: AuditLine[]; totalValue: number };
  currentInventory: { lines: AuditLine[]; totalValue: number };
  notes: string[];
};

function money2(n: number): number {
  return Math.round(n * 100) / 100;
}

function inYear(iso: string | null, year: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === year;
}

function lineFromInventory(row: InventoryRow): AuditLine {
  const quantity = Number(row.quantity ?? 0);
  const unitValue = Number(row.market_value_per_unit ?? 0);
  return {
    label: row.item_description || row.reference_number || `Inventory #${row.id}`,
    quantity,
    unitValue,
    totalValue: money2(quantity * unitValue),
  };
}

export async function fetchAuditReport(year: number): Promise<AuditReportData> {
  const { data: inventory, error: inventoryError } = await supabaseServer
    .from("inventory")
    .select("id, created_at, item_description, reference_number, quantity, market_value_per_unit, status, acquisition_method");
  if (inventoryError) throw new Error(inventoryError.message);

  const { data: missionUsage, error: missionError } = await supabaseServer
    .from("mission_inventory")
    .select("quantity_used, missions:mission_id(mission_name,start_date), inventory:inventory_id(item_description,market_value_per_unit)");
  if (missionError) throw new Error(missionError.message);

  const invRows = (inventory ?? []) as unknown as InventoryRow[];
  const usageRows = (missionUsage ?? []) as unknown as MissionUsageRow[];

  const donatedLines = invRows
    .filter((r) => (r.acquisition_method ?? "").toLowerCase() === "donation" && inYear(r.created_at, year))
    .map(lineFromInventory);

  const returnedLines = invRows
    .filter((r) => (r.status ?? "").toLowerCase().includes("return"))
    .map(lineFromInventory);

  const currentInventoryLines = invRows
    .filter((r) => Number(r.quantity ?? 0) > 0)
    .map(lineFromInventory);

  const byMission = new Map<string, MissionUsageSummary>();
  for (const row of usageRows) {
    const mission = pickOne(row.missions);
    const inv = pickOne(row.inventory);
    if (!inYear(mission?.start_date ?? null, year)) continue;
    const missionName = mission?.mission_name || "Unnamed Mission";
    const qty = Number(row.quantity_used ?? 0);
    const unitValue = Number(inv?.market_value_per_unit ?? 0);
    const line: AuditLine = {
      label: inv?.item_description || "Unknown item",
      quantity: qty,
      unitValue,
      totalValue: money2(qty * unitValue),
    };

    const existing = byMission.get(missionName);
    if (!existing) {
      byMission.set(missionName, { missionName, lines: [line], totalValue: line.totalValue });
    } else {
      existing.lines.push(line);
      existing.totalValue = money2(existing.totalValue + line.totalValue);
    }
  }

  const missions = [...byMission.values()].sort((a, b) => a.missionName.localeCompare(b.missionName));

  const sum = (lines: AuditLine[]) => money2(lines.reduce((s, l) => s + l.totalValue, 0));
  const usedGrandTotal = money2(missions.reduce((s, m) => s + m.totalValue, 0));

  return {
    year,
    donated: { lines: donatedLines, totalValue: sum(donatedLines) },
    usedByMission: { missions, totalValue: usedGrandTotal },
    returned: { lines: returnedLines, totalValue: sum(returnedLines) },
    currentInventory: { lines: currentInventoryLines, totalValue: sum(currentInventoryLines) },
    notes: [
      "Donated items are identified by acquisition_method = donation and created_at in this year.",
      "Returned items are identified by status containing 'return'.",
      "Mission used totals use mission_inventory.quantity_used x current inventory.market_value_per_unit.",
      "Donor-specific filtering (e.g. Sunny only) requires a donor field in your schema.",
    ],
  };
}

