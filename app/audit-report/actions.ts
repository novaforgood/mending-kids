"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { ACQUISITION_METHODS } from "./constants";

type InventoryRow = {
  id: number;
  created_at: string;
  item_description: string | null;
  reference_number: string | null;
  quantity: number | null;
  initial_quantity: number | null;
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
  initQuantity: number;
  unitValue: number;
  totalValue: number;
};

export type MissionUsageSummary = {
  missionName: string;
  lines: AuditLine[];
  totalValue: number;
};

export type AcquisitionSection = {
  method: string;
  label: string;
  lines: AuditLine[];
  totalValue: number;
};

export type AuditReportData = {
  year: number;
  receivedByAcquisition: AcquisitionSection[];
  usedByMission: { missions: MissionUsageSummary[]; totalValue: number };
  currentInventory: { lines: AuditLine[]; totalValue: number };
};

function money2(n: number): number {
  return Math.round(n * 100) / 100;
}

function inYear(iso: string | null, year: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === year;
}

function initQty(row: InventoryRow): number {
  const initial = row.initial_quantity;
  if (initial != null && Number.isFinite(Number(initial))) {
    return Number(initial);
  }
  return Number(row.quantity ?? 0);
}

function lineFromInventory(row: InventoryRow): AuditLine {
  const initQuantity = initQty(row);
  const unitValue = Number(row.market_value_per_unit ?? 0);
  return {
    label: row.item_description || row.reference_number || `Inventory #${row.id}`,
    initQuantity,
    unitValue,
    totalValue: money2(initQuantity * unitValue),
  };
}

function normalizeMethod(raw: string | null): string {
  const m = (raw ?? "").trim().toLowerCase();
  if (ACQUISITION_METHODS.some((a) => a.key === m)) return m;
  return m || "unspecified";
}

const INVENTORY_SELECT_WITH_INIT =
  "id, created_at, item_description, reference_number, quantity, initial_quantity, market_value_per_unit, status, acquisition_method";
const INVENTORY_SELECT_WITHOUT_INIT =
  "id, created_at, item_description, reference_number, quantity, market_value_per_unit, status, acquisition_method";

export async function fetchAuditReport(year: number): Promise<AuditReportData> {
  let { data: inventory, error: inventoryError } = await supabaseServer
    .from("inventory")
    .select(INVENTORY_SELECT_WITH_INIT);

  if (inventoryError?.message?.includes("initial_quantity")) {
    ({ data: inventory, error: inventoryError } = await supabaseServer
      .from("inventory")
      .select(INVENTORY_SELECT_WITHOUT_INIT));
  }
  if (inventoryError) throw new Error(inventoryError.message);

  const invRows = ((inventory ?? []) as Record<string, unknown>[]).map((row) => ({
    ...(row as InventoryRow),
    initial_quantity: (row.initial_quantity as number | null | undefined) ?? null,
  }));

  const { data: missionUsage, error: missionError } = await supabaseServer
    .from("mission_inventory")
    .select("quantity_used, missions:mission_id(mission_name,start_date), inventory:inventory_id(item_description,market_value_per_unit)");
  if (missionError) throw new Error(missionError.message);

  const usageRows = (missionUsage ?? []) as unknown as MissionUsageRow[];

  const receivedInYear = invRows.filter((r) => inYear(r.created_at, year));

  const receivedByAcquisition: AcquisitionSection[] = ACQUISITION_METHODS.map(({ key, label }) => {
    const lines = receivedInYear
      .filter((r) => normalizeMethod(r.acquisition_method) === key)
      .map(lineFromInventory)
      .sort((a, b) => a.label.localeCompare(b.label));
    const totalValue = money2(lines.reduce((s, l) => s + l.totalValue, 0));
    return { method: key, label, lines, totalValue };
  });

  const unspecifiedLines = receivedInYear
    .filter((r) => !ACQUISITION_METHODS.some((a) => a.key === normalizeMethod(r.acquisition_method)))
    .map(lineFromInventory)
    .sort((a, b) => a.label.localeCompare(b.label));
  if (unspecifiedLines.length > 0) {
    receivedByAcquisition.push({
      method: "unspecified",
      label: "Unspecified",
      lines: unspecifiedLines,
      totalValue: money2(unspecifiedLines.reduce((s, l) => s + l.totalValue, 0)),
    });
  }

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
      initQuantity: qty,
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
    receivedByAcquisition,
    usedByMission: { missions, totalValue: usedGrandTotal },
    currentInventory: { lines: currentInventoryLines, totalValue: sum(currentInventoryLines) },
  };
}
