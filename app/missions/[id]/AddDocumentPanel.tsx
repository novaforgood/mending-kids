"use client";

import { useCallback, useRef, useState } from "react";
import Button from "@atlaskit/button/new";
import SidePanel, { PanelLabel } from "@/components/SidePanel";
import { useAuthUser } from "@/app/hooks/authUser";

export type DocumentEntry = {
  id: string;
  name: string;
  type: string;
  uploaded_by: string;
  created_at: string;
  url?: string;
};

type Props = {
  isOpen: boolean;
  missionId: number;
  onClose: () => void;
  onAdded: (doc: DocumentEntry) => void;
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0, left: 0, width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 2000,
};

const popupStyle = {
  backgroundColor: "white", color: "black",
  padding: "20px", borderRadius: "8px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  textAlign: "center" as const, minWidth: "300px",
};

export default function AddDocumentPanel({ isOpen, missionId, onClose, onAdded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthUser();

  function handleClose() {
    setFile(null);
    setErrorMsg("");
    onClose();
  }

  const handleFileSelect = useCallback((f: File) => setFile(f), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  async function handleUpload() {
    if (!file) return;

    setSaving(true);
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uploadedBy", user?.email ?? "unknown");

      const res = await fetch(`/api/missions/${missionId}/documents`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Upload failed");
      }

      const doc: DocumentEntry = await res.json();
      setFile(null);
      onAdded(doc);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={handleClose}
      label="Add Document"
      title="Add Document"
      subtitle="Select a file to attach to this mission"
      footerLeft={<span />}
      footerRight={<span />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 16 }}>
        <div>
          <PanelLabel required>File</PanelLabel>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${isDragOver ? "#0052CC" : "#C1C7D0"}`,
              borderRadius: 4, padding: 20, textAlign: "center",
              backgroundColor: isDragOver ? "#DEEBFF" : "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, transition: "background-color 0.15s", cursor: "pointer",
            }}
          >
            <span style={{ color: "#6B778C", fontSize: 13 }}>↑ Drop a file here or</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{
                border: "2px solid #DFE1E6", borderRadius: 4, padding: "5px 12px",
                background: "white", cursor: "pointer", fontSize: 13,
                fontWeight: 500, color: "#172B4D",
              }}
            >
              📎 Browse
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = "";
              }}
            />
          </div>

          {file && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 6,
              border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 22 }}>
                  {file.type.startsWith("image/") ? "🖼️" : file.type === "application/pdf" ? "📕" : "📄"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#172B4D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B778C" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B778C", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e4e6ea", paddingTop: 12, marginTop: 24 }}>
        <Button appearance="subtle" onClick={handleClose} isDisabled={saving}>Cancel</Button>
        <Button appearance="primary" isDisabled={!file || saving} isLoading={saving} onClick={handleUpload}>
          Upload
        </Button>
      </div>

      {errorMsg && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p>{errorMsg}</p>
            <button onClick={() => setErrorMsg("")}>OK</button>
          </div>
        </div>
      )}
    </SidePanel>
  );
}
