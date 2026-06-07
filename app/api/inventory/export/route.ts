import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import PDFDocument from "pdfkit";

const COLUMNS = [
  { key: "item_description",      label: "Item Description",    width: 120 },
  { key: "manufacturer",          label: "Manufacturer",        width: 90 },
  { key: "reference_number",      label: "Ref #",               width: 70 },
  { key: "quantity",              label: "Qty",                 width: 35 },
  { key: "status",                label: "Status",              width: 60 },
  { key: "mission",               label: "Mission",             width: 60 },
  { key: "expiration",            label: "Expiration",          width: 70 },
  { key: "market_value_per_unit", label: "$/Unit",              width: 50 },
  { key: "total_value",           label: "Total",               width: 55 },
  { key: "acquisition_method",    label: "Acquisition",         width: 75 },
] as const;

type Col = (typeof COLUMNS)[number];

function cellValue(item: Record<string, unknown>, col: Col): string {
  const v = item[col.key];
  if (v === null || v === undefined) return "—";
  if (col.key === "market_value_per_unit" || col.key === "total_value") {
    return `$${Number(v).toFixed(2)}`;
  }
  if (col.key === "expiration") {
    return new Date(v as string).toLocaleDateString("en-US");
  }
  return String(v);
}

async function fetchItems() {
  const { data, error } = await supabaseServer
    .from("inventory")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown>[];
}

// ─── CSV ────────────────────────────────────────────────────────────────────

function buildCSV(items: Record<string, unknown>[]): string {
  const headers = COLUMNS.map((c) => c.label).join(",");
  const rows = items.map((item) =>
    COLUMNS.map((c) => {
      const val = cellValue(item, c).replace(/"/g, '""');
      return `"${val}"`;
    }).join(",")
  );
  return [headers, ...rows].join("\r\n");
}

// ─── PDF ────────────────────────────────────────────────────────────────────

async function buildPDF(items: Record<string, unknown>[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);

    const PAGE_WIDTH = doc.page.width - 60; // left+right margin
    const totalDefinedWidth = COLUMNS.reduce((s, c) => s + c.width, 0);
    const scale = PAGE_WIDTH / totalDefinedWidth;
    const colWidths = COLUMNS.map((c) => c.width * scale);

    // ── Title ──
    doc
      .fontSize(16)
      .fillColor("#1A1A2E")
      .text("Mending Kids — Inventory Export", 30, 30);
    doc
      .fontSize(9)
      .fillColor("#555")
      .text(`Generated ${new Date().toLocaleString("en-US")}`, 30, doc.y + 2);

    const TABLE_TOP = doc.y + 12;
    const ROW_HEIGHT = 18;
    const FONT_SIZE = 7;
    let y = TABLE_TOP;
    const x = 30;

    // ── Header row ──
    doc.rect(x, y, PAGE_WIDTH, ROW_HEIGHT).fill("#1A1A2E");
    doc.fontSize(FONT_SIZE).fillColor("#FFFFFF");
    let cx = x;
    COLUMNS.forEach((col, i) => {
      doc.text(col.label, cx + 3, y + 5, { width: colWidths[i] - 6, ellipsis: true });
      cx += colWidths[i];
    });
    y += ROW_HEIGHT;

    // ── Data rows ──
    items.forEach((item, rowIdx) => {
      // Page break check (leave 40 px margin at bottom)
      if (y + ROW_HEIGHT > doc.page.height - 40) {
        doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
        y = 30;
        // Repeat header on new page
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

      // Bottom border
      doc
        .moveTo(30, y + ROW_HEIGHT)
        .lineTo(30 + PAGE_WIDTH, y + ROW_HEIGHT)
        .strokeColor("#E0E0E0")
        .lineWidth(0.5)
        .stroke();

      y += ROW_HEIGHT;
    });

    // ── Totals row ──
    const grandTotal = items.reduce((s, i) => s + Number(i.total_value ?? 0), 0);
    doc.rect(30, y, PAGE_WIDTH, ROW_HEIGHT).fill("#DDE8F0");
    doc.fontSize(FONT_SIZE).fillColor("#111");
    doc.text(`Total items: ${items.length}`, 33, y + 5);
    const totalColOffset = colWidths.slice(0, 8).reduce((s, w) => s + w, 0);
    doc.text(`$${grandTotal.toFixed(2)}`, 30 + totalColOffset + 3, y + 5, {
      width: colWidths[8] - 6,
    });

    doc.end();
  });
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  try {
    const items = await fetchItems();

    if (format === "pdf") {
      const bytes = await buildPDF(items);
      return new NextResponse(bytes.buffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="inventory-${Date.now()}.pdf"`,
          "Content-Length": String(bytes.byteLength),
        },
      });
    }

    // default: CSV
    const csv = buildCSV(items);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
