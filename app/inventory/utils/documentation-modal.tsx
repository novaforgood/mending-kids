"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Button from "@atlaskit/button/new";
import Textfield from "@atlaskit/textfield";
import CameraIcon from "@atlaskit/icon/core/camera";
import LinkIcon from "@atlaskit/icon/core/link";

type ItemOption = {
  id: number;
  label: string;
  market_value_per_unit: number;
  valuation_source: string | null;
  acquisition_method: string | null;
};

type DocumentationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onNext: (itemId: number, marketValue: number, valuationSource: string, acquisitionMethod: string) => void;
  preSelectedItemId?: number | null;
  items?: ItemOption[];
};

type UploadedFile = {
  name: string;
  date: string;
  preview: string | null;
};

export default function DocumentationModal({
  isOpen,
  onClose,
  onNext,
  preSelectedItemId = null,
  items = [],
}: DocumentationModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | "">(preSelectedItemId ?? "");
  const [marketValue, setMarketValue] = useState("");
  const [valuationSource, setValuationSource] = useState("");
  const [acquisitionMethod, setAcquisitionMethod] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill fields whenever the modal opens or preSelectedItemId changes
  useEffect(() => {
    if (!isOpen) return;
    const id = preSelectedItemId ?? "";
    setSelectedItemId(id);
    prefillFromItem(id);
  }, [isOpen, preSelectedItemId]);

  function prefillFromItem(id: number | "") {
    if (id === "") {
      setMarketValue("");
      setValuationSource("");
      setAcquisitionMethod("");
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item) {
      setMarketValue(item.market_value_per_unit > 0 ? String(item.market_value_per_unit) : "");
      setValuationSource(item.valuation_source ?? "");
      setAcquisitionMethod(item.acquisition_method ?? "");
    }
  }

  function handleItemSelect(id: number | "") {
    setSelectedItemId(id);
    prefillFromItem(id);
  }

  const aiSuggestedSources = [
    "https://www.amazon.com/JorVet-Veterinary-Grad...",
    "https://www.abbott.com/en-us/products-solution...",
  ];

  // Filled state: when a valuation source has been selected
  const isFilled = valuationSource.trim() !== "";

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        name: file.name,
        date: new Date().toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        preview: file.type.startsWith("image/")
          ? (e.target?.result as string)
          : null,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 8,
          width: "90%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "#6B778C",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }} />
          <Button appearance="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            isDisabled={selectedItemId === ""}
            onClick={() => {
              if (selectedItemId !== "") {
                onNext(selectedItemId, parseFloat(marketValue) || 0, valuationSource, acquisitionMethod);
              }
            }}
          >
            Next
          </Button>
        </div>

        {/* Green progress bar */}
        <div
          style={{ height: 3, backgroundColor: "#00875A", width: "100%" }}
        />

        {/* Body */}
        <div style={{ padding: 24 }}>
          <h2 style={{ margin: "0 0 4px 0", fontSize: 20, fontWeight: 600, color: "#172B4D" }}>
            Add documentation
          </h2>
          <p style={{ margin: "0 0 24px 0", fontSize: 13, color: "#6B778C" }}>
            <span style={{ color: "#DE350B" }}>*</span> indicates a required field
          </p>

          {/* Item selector — only shown when not opened from a specific row */}
          {preSelectedItemId === null && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#172B4D" }}>
                Select Item <span style={{ color: "#DE350B" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={selectedItemId}
                  onChange={(e) => handleItemSelect(e.currentTarget.value === "" ? "" : Number(e.currentTarget.value))}
                  style={{
                    width: "100%",
                    padding: "9px 36px 9px 12px",
                    border: "2px solid #DFE1E6",
                    borderRadius: 3,
                    fontSize: 14,
                    color: selectedItemId === "" ? "#6B778C" : "#172B4D",
                    backgroundColor: "white",
                    cursor: "pointer",
                    appearance: "none",
                    WebkitAppearance: "none",
                  }}
                >
                  <option value="">Select an inventory item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B778C", fontSize: 12 }}>
                  ▾
                </span>
              </div>
            </div>
          )}

          {/* Market Value per Unit */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "#172B4D",
              }}
            >
              Market Value per Unit{" "}
              <span style={{ color: "#DE350B" }}>*</span>
            </label>
            <Textfield
              placeholder="Add market value"
              value={marketValue}
              onChange={(e) => setMarketValue(e.currentTarget.value)}
              elemBeforeInput={
                <span
                  style={{
                    marginLeft: 8,
                    display: "flex",
                    alignItems: "center",
                    color: "#6B778C",
                    flexShrink: 0,
                  }}
                >
                  <CameraIcon label="" size="small" />
                </span>
              }
            />
          </div>

          {/* Valuation Source */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "#172B4D",
              }}
            >
              Valuation Source
            </label>
            <div
              style={{
                borderRadius: 3,
                outline: isFilled ? "2px dashed #0052CC" : "none",
              }}
            >
              <Textfield
                placeholder="Add a valuation source"
                value={valuationSource}
                onChange={(e) => setValuationSource(e.currentTarget.value)}
                elemBeforeInput={
                  <span
                    style={{
                      marginLeft: 8,
                      display: "flex",
                      alignItems: "center",
                      color: "#6B778C",
                      flexShrink: 0,
                    }}
                  >
                    <LinkIcon label="" size="small" />
                  </span>
                }
              />
            </div>
          </div>

          {/* AI Suggested Sources — hidden when a source is selected */}
          {!isFilled && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#172B4D",
                }}
              >
                AI Suggested Sources
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {aiSuggestedSources.map((source, index) => (
                  <button
                    key={index}
                    onClick={() => setValuationSource(source)}
                    style={{
                      background: "#F4F5F7",
                      border: "none",
                      textAlign: "left",
                      padding: "8px 12px",
                      cursor: "pointer",
                      color: "#0052CC",
                      fontSize: 13,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#DEEBFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F4F5F7";
                    }}
                  >
                    <span style={{ fontSize: 14 }}>🌐</span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {source}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acquisition Method */}
          <div
            style={{
              marginBottom: 20,
              borderRadius: 4,
              outline: isFilled ? "2px dashed #0052CC" : "none",
              padding: isFilled ? 12 : 0,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: "#172B4D",
              }}
            >
              Acquisition Method{" "}
              <span style={{ color: "#DE350B" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={acquisitionMethod}
                onChange={(e) => setAcquisitionMethod(e.currentTarget.value)}
                style={{
                  width: "100%",
                  padding: "9px 36px 9px 12px",
                  border: "2px solid #DFE1E6",
                  borderRadius: 3,
                  fontSize: 14,
                  color: acquisitionMethod ? "#172B4D" : "#6B778C",
                  backgroundColor: "white",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                <option value="" disabled>
                  Select acquisition method
                </option>
                <option value="donation">Donation</option>
                <option value="purchase">Purchase</option>
                <option value="grant">Grant</option>
                <option value="loan">Loan</option>
              </select>
              {/* Custom chevron */}
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#6B778C",
                  fontSize: 12,
                }}
              >
                ▾
              </span>
            </div>
          </div>

          {/* Upload Document */}
          <div
            style={{
              borderRadius: 4,
              outline: isFilled ? "2px dashed #0052CC" : "none",
              padding: isFilled ? 12 : 0,
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "#172B4D",
              }}
            >
              Upload Document
            </label>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `1.5px dashed ${isDragOver ? "#0052CC" : "#C1C7D0"}`,
                borderRadius: 4,
                padding: "16px",
                textAlign: "center",
                backgroundColor: isDragOver ? "#DEEBFF" : "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: uploadedFile ? 12 : 0,
                transition: "background-color 0.15s",
              }}
            >
              <span style={{ color: "#6B778C", fontSize: 13 }}>
                ↑ Drop files to attach or
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px solid #DFE1E6",
                  borderRadius: 4,
                  padding: "5px 12px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: "#172B4D",
                }}
              >
                📎 Browse
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {/* File preview card */}
            {uploadedFile && (
              <div
                style={{
                  display: "inline-block",
                  width: 160,
                  borderRadius: 6,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  backgroundColor: "white",
                  marginTop: 4,
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: 96,
                    background: uploadedFile.preview
                      ? `url(${uploadedFile.preview}) center/cover`
                      : "linear-gradient(135deg, #7B61FF 0%, #C56DED 50%, #4FC3F7 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!uploadedFile.preview && (
                    <span style={{ fontSize: 36 }}>📄</span>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "8px 10px" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#172B4D",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B778C", marginTop: 2 }}>
                    {uploadedFile.date}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
