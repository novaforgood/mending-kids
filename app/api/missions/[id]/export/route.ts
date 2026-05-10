import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import PDFDocument from "pdfkit";

const COLUMNS = [
  { key: "item_description", label: "Item Description", width: 140 },
  { key: "manufacturer", label: "Manufacturer", width: 90 },
  { key: "reference_number", label: "Ref #", width: 70 },
  { key: "quantity_used", label: "Qty Used", width: 50 },
  { key: "market_value_per_unit", label: "$/Unit", width: 55 },
  { key: "total_value", label: "Total", width: 60 },
] as const;

type Col = (typeof COLUMNS)[number];

type MissionExportRow = {
  item_description: string;
  manufacturer: string;
  reference_number: string;
  quantity_used: number;
  market_value_per_unit: number;
  total_value: number;
};

type MissionInventoryJoinedRow = {
  quantity_used: number | null;
  inventory: {
    item_description: string | null;
    manufacturer: string | null;
    reference_number: string | null;
    market_value_per_unit: number | null;
  } | null;
};

function cellValue(item: MissionExportRow, col: Col): string {
  const v = item[col.key];
  if (v === null || v === undefined) return "—";
  if (col.key === "market_value_per_unit" || col.key === "total_value") {
    return `$${Number(v).toFixed(2)}`;
  }
  return String(v);
}

async function fetchMissionItems(missionId: number): Promise<{ missionName: string; rows: MissionExportRow[] }> {
  const { data: mission, error: missionError } = await supabaseServer
    .from("missions")
    .select("mission_name")
    .eq("id", missionId)
    .maybeSingle();
  if (missionError) throw new Error(missionError.message);
  if (!mission) throw new Error("Mission not found");

  const { data, error } = await supabaseServer
    .from("mission_inventory")
    .select(`
      quantity_used,
      inventory:inventory_id (
        item_description,
        manufacturer,
        reference_number,
        market_value_per_unit
      )
    `)
    .eq("mission_id", missionId);
  if (error) throw new Error(error.message);

  const rows: MissionExportRow[] = ((data ?? []) as MissionInventoryJoinedRow[]).map((row) => {
    const qty = Number(row.quantity_used ?? 0);
    const unit = Number(row.inventory?.market_value_per_unit ?? 0);
    return {
      item_description: row.inventory?.item_description ?? "—",
      manufacturer: row.inventory?.manufacturer ?? "—",
      reference_number: row.inventory?.reference_number ?? "—",
      quantity_used: qty,
      market_value_per_unit: unit,
      total_value: Math.round(qty * unit * 100) / 100,
    };
  });

  return { missionName: mission.mission_name ?? `mission-${missionId}`, rows };
}

function buildCSV(items: MissionExportRow[]): string {
  const headers = COLUMNS.map((c) => c.label).join(",");
  const rows = items.map((item) =>
    COLUMNS.map((c) => {
      const val = cellValue(item, c).replace(/"/g, '""');
      return `"${val}"`;
    }).join(",")
  );
  return [headers, ...rows].join("\r\n");
}

async function buildPDF(missionName: string, items: MissionExportRow[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);

    const PAGE_WIDTH = doc.page.width - 60;
    const totalDefinedWidth = COLUMNS.reduce((s, c) => s + c.width, 0);
    const scale = PAGE_WIDTH / totalDefinedWidth;
    const colWidths = COLUMNS.map((c) => c.width * scale);

    doc
      .fontSize(16)
      .fillColor("#1A1A2E")
      .text(`Mending Kids — Mission Export: ${missionName}`, 30, 30);
    doc
      .fontSize(9)
      .fillColor("#555")
      .text(`Generated ${new Date().toLocaleString("en-US")}`, 30, doc.y + 2);

    const TABLE_TOP = doc.y + 12;
    const ROW_HEIGHT = 18;
    const FONT_SIZE = 8;
    let y = TABLE_TOP;

    doc.rect(30, y, PAGE_WIDTH, ROW_HEIGHT).fill("#1A1A2E");
    doc.fontSize(FONT_SIZE).fillColor("#FFFFFF");
    let cx = 30;
    COLUMNS.forEach((col, i) => {
      doc.text(col.label, cx + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
      cx += colWidths[i];
    });
    y += ROW_HEIGHT;

    items.forEach((item, rowIdx) => {
      if (y + ROW_HEIGHT > doc.page.height - 40) {
        doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
        y = 30;
        doc.rect(30, y, PAGE_WIDTH, ROW_HEIGHT).fill("#1A1A2E");
        doc.fontSize(FONT_SIZE).fillColor("#FFFFFF");
        let hx = 30;
        COLUMNS.forEach((col, i) => {
          doc.text(col.label, hx + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
          hx += colWidths[i];
        });
        y += ROW_HEIGHT;
      }

      const bg = rowIdx % 2 === 0 ? "#F7F8FA" : "#FFFFFF";
      doc.rect(30, y, PAGE_WIDTH, ROW_HEIGHT).fill(bg);

      doc.fontSize(FONT_SIZE).fillColor("#111");
      cx = 30;
      COLUMNS.forEach((col, i) => {
        doc.text(cellValue(item, col), cx + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
        cx += colWidths[i];
      });

      doc
        .moveTo(30, y + ROW_HEIGHT)
        .lineTo(30 + PAGE_WIDTH, y + ROW_HEIGHT)
        .strokeColor("#E0E0E0")
        .lineWidth(0.5)
        .stroke();

      y += ROW_HEIGHT;
    });

    const grandTotal = items.reduce((s, i) => s + Number(i.total_value ?? 0), 0);
    doc.rect(30, y, PAGE_WIDTH, ROW_HEIGHT).fill("#DDE8F0");
    doc.fontSize(FONT_SIZE).fillColor("#111");
    doc.text(`Total rows: ${items.length}`, 33, y + 5);
    const totalColOffset = colWidths.slice(0, 5).reduce((s, w) => s + w, 0);
    doc.text(`$${grandTotal.toFixed(2)}`, 30 + totalColOffset + 3, y + 5, {
      width: colWidths[5] - 6,
    });

    doc.end();
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const missionId = Number(id);
  if (!Number.isInteger(missionId)) {
    return NextResponse.json({ error: "Invalid mission id" }, { status: 400 });
  }

  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  try {
    const { missionName, rows } = await fetchMissionItems(missionId);

    if (format === "pdf") {
      const bytes = await buildPDF(missionName, rows);
      return new NextResponse(bytes.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="mission-${missionId}-${Date.now()}.pdf"`,
          "Content-Length": String(bytes.byteLength),
        },
      });
    }

    const csv = buildCSV(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mission-${missionId}-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    const status = msg === "Mission not found" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

