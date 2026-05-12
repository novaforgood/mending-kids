"use client";

import React, { useState } from "react";
import CustomButton from "./custom-button";

interface Props {
  itemDescription: string;
  onConfirm: (quantity: number, notes: string) => Promise<void>;
  onClose: () => void;
}

export default function AddQuantityModal({ itemDescription, onConfirm, onClose }: Props) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm(qty, notes);
    } catch (e: any) {
      setError(e.message || "Failed to add items.");
      setIsSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0,0,0,0.3)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white", borderRadius: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", width: 400, overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #DFE1E6", fontWeight: 600, fontSize: 16, color: "#172B4D" }}>
          Add Items — {itemDescription}
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>
              Quantity to Add <span style={{ color: "#DE350B" }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setError(null); }}
              placeholder="Enter quantity"
              autoFocus
              style={{
                padding: "8px 12px",
                border: `1px solid ${error ? "#DE350B" : "#DFE1E6"}`,
                borderRadius: 6, fontSize: 14, outline: "none",
              }}
            />
            {error && <span style={{ fontSize: 12, color: "#DE350B" }}>{error}</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#6B778C" }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received from supplier, donation batch..."
              rows={3}
              style={{
                padding: "8px 12px", border: "1px solid #DFE1E6", borderRadius: 6,
                fontSize: 14, resize: "vertical", fontFamily: "inherit", outline: "none",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #DFE1E6", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <CustomButton backgroundColor="#EBECF0" textColor="#172B4D" onClick={onClose} isDisabled={isSaving}>
            Cancel
          </CustomButton>
          <CustomButton backgroundColor="#422670" textColor="#FFFFFF" onClick={handleConfirm} isDisabled={isSaving}>
            {isSaving ? "Adding..." : "Confirm"}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}