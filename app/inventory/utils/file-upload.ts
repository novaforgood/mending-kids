import type { DocumentUploadPayload } from "./types";

export async function fileToDocumentUpload(file: File): Promise<DocumentUploadPayload> {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    base64,
  };
}
