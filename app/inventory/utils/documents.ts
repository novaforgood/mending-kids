"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type { DocumentEntry, DocumentUploadPayload } from "./types";

const STORAGE_BUCKET = "inventory-documents";
const MAX_INLINE_BYTES = 750_000;

function docTypeFromMime(mime: string): string {
  if (mime.startsWith("image/")) return "Image";
  if (mime === "application/pdf") return "PDF";
  const part = mime.split("/")[1];
  return part ? part.toUpperCase() : "File";
}

export async function appendInventoryDocument(
  inventoryId: number,
  upload: DocumentUploadPayload,
  uploadedBy: string
): Promise<DocumentEntry> {
  const bytes = Buffer.from(upload.base64, "base64");

  const { data: row, error: fetchError } = await supabaseServer
    .from("inventory")
    .select("documents")
    .eq("id", inventoryId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const existing = Array.isArray(row.documents) ? (row.documents as DocumentEntry[]) : [];
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  let url: string | undefined;
  if (bytes.length <= MAX_INLINE_BYTES) {
    url = `data:${upload.mimeType};base64,${upload.base64}`;
  } else {
    const safeName = upload.name.replace(/[^\w.-]/g, "_");
    const path = `${inventoryId}/${id}-${safeName}`;
    const { error: uploadError } = await supabaseServer.storage
      .from(STORAGE_BUCKET)
      .upload(path, bytes, { contentType: upload.mimeType, upsert: false });

    if (uploadError) {
      throw new Error(
        `Could not upload document (${uploadError.message}). ` +
          `For large files, create a public Supabase storage bucket named "${STORAGE_BUCKET}".`
      );
    }

    const { data: urlData } = supabaseServer.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    url = urlData.publicUrl;
  }

  const entry: DocumentEntry = {
    id,
    name: upload.name,
    type: docTypeFromMime(upload.mimeType),
    uploaded_by: uploadedBy,
    created_at,
    url,
  };

  const { error: updateError } = await supabaseServer
    .from("inventory")
    .update({ documents: [...existing, entry] })
    .eq("id", inventoryId);
  if (updateError) throw new Error(updateError.message);

  return entry;
}
