import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

const BUCKET = "mission-documents";

function typeFromMime(mime: string) {
  if (mime.startsWith("image/")) return "Image";
  if (mime === "application/pdf") return "PDF";
  return mime.split("/")[1]?.toUpperCase() ?? "File";
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const missionId = Number(id);
  if (!Number.isInteger(missionId)) {
    return NextResponse.json({ error: "Invalid mission id" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const uploadedBy = (form.get("uploadedBy") as string) || "unknown";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    // Upload to Supabase Storage server-side (service role — no RLS issues)
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${missionId}/${Date.now()}-${safeName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);

    // Append metadata to the missions.documents JSONB column
    const { data: row, error: fetchError } = await supabaseServer
      .from("missions")
      .select("documents")
      .eq("id", missionId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const existing = Array.isArray(row.documents) ? row.documents : [];
    const entry = {
      id: crypto.randomUUID(),
      name: file.name,
      type: typeFromMime(file.type),
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
      url: urlData.publicUrl,
    };

    const { error: updateError } = await supabaseServer
      .from("missions")
      .update({ documents: [...existing, entry] })
      .eq("id", missionId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const missionId = Number(id);
  if (!Number.isInteger(missionId)) {
    return NextResponse.json({ error: "Invalid mission id" }, { status: 400 });
  }

  const { docId } = await req.json();
  if (!docId) {
    return NextResponse.json({ error: "No docId provided" }, { status: 400 });
  }

  try {
    const { data: row, error: fetchError } = await supabaseServer
      .from("missions")
      .select("documents")
      .eq("id", missionId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const existing: { id: string; url?: string }[] = Array.isArray(row.documents) ? row.documents : [];
    const toRemove = existing.find((d) => d.id === docId);

    // Delete from storage if it was stored there (not an inline data URL)
    if (toRemove?.url && !toRemove.url.startsWith("data:")) {
      const path = toRemove.url.split(`${BUCKET}/`)[1];
      if (path) {
        await supabaseServer.storage.from(BUCKET).remove([path]);
      }
    }

    const updated = existing.filter((d) => d.id !== docId);
    const { error: updateError } = await supabaseServer
      .from("missions")
      .update({ documents: updated })
      .eq("id", missionId);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
