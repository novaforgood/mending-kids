"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Button from "@atlaskit/button/new";
import Textfield from "@atlaskit/textfield";
import CameraIcon from "@atlaskit/icon/core/camera";
import LinkIcon from "@atlaskit/icon/core/link";
import type { InventoryPayload } from "../utils/types";
import ValuationSuggestedSources from "./ValuationSuggestedSources";

type AddItemPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: InventoryPayload) => Promise<void>;
  isSaving?: boolean;
};

type UploadedFile = {
  name: string;
  date: string;
  preview: string | null;
};

export default function AddItemPanel({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AddItemPanelProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [itemDescription, setItemDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [typicalShelfLife, setTypicalShelfLife] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [location, setLocation] = useState("");

  // Step 2 fields
  const [marketValue, setMarketValue] = useState("");
  const [valuationSource, setValuationSource] = useState("");
  const [acquisitionMethod, setAcquisitionMethod] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFilled = valuationSource.trim() !== "";

  function resetAll() {
    setStep(1);
    setItemDescription("");
    setReferenceNumber("");
    setManufacturer("");
    setLotNumber("");
    setUnitOfMeasure("");
    setTypicalShelfLife("");
    setExpirationDate("");
    setLocation("");
    setMarketValue("");
    setValuationSource("");
    setAcquisitionMethod("");
    setUploadedFile(null);
    setIsDragOver(false);
    setErrors({});
  }

  useEffect(() => {
    if (!isOpen) resetAll();
  }, [isOpen]);

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

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!itemDescription.trim()) e.itemDescription = "Required";
    if (!unitOfMeasure) e.unitOfMeasure = "Required";
    if (!expirationDate) e.expirationDate = "Required";
    if (!location) e.location = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!marketValue || isNaN(parseFloat(marketValue))) e.marketValue = "Required";
    if (!acquisitionMethod) e.acquisitionMethod = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else {
      if (!validateStep2()) return;
      await onSave({
        item_description: itemDescription,
        reference_number: referenceNumber,
        manufacturer,
        lot_number: lotNumber,
        unit_of_measure: unitOfMeasure,
        typical_shelf_life: typicalShelfLife,
        expiration: new Date(expirationDate),
        location,
        market_value_per_unit: parseFloat(marketValue) || 0,
        valuation_source: valuationSource,
        acquisition_method: acquisitionMethod,
        quantity: 0,
        status: "",
        mission: "",
      });
    }
  }

  const label = (text: string, required = false, error?: string) => (
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#172B4D" }}>
        {text}
        {required && <span style={{ color: "#DE350B" }}>*</span>}
      </label>
      {error && (
        <span style={{ fontSize: 12, color: "#DE350B", marginLeft: 8 }}>{error}</span>
      )}
    </div>
  );

  const selectStyle = (hasValue: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "9px 32px 9px 12px",
    border: "2px solid #DFE1E6",
    borderRadius: 3,
    fontSize: 14,
    color: hasValue ? "#172B4D" : "#6B778C",
    backgroundColor: "white",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
  });

  return (
    <>
      {/* Dimmed overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 400,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Side panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          backgroundColor: "white",
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            height: 3,
            backgroundColor: "#5243AA",
            width: step === 1 ? "50%" : "100%",
            transition: "width 0.3s ease",
          }}
        />

        {/* Header */}
        <div style={{ padding: "20px 24px 0" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "#6B778C",
              fontSize: 20,
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            ×
          </button>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#172B4D" }}>
            {step === 1 ? "Add item" : "Add documentation"}
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B778C" }}>
            <span style={{ color: "#DE350B" }}>*</span> indicates a required field
          </p>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 16px" }}>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                {label("Item Description", true, errors.itemDescription)}
                <Textfield
                  placeholder="Add item description"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.currentTarget.value)}
                />
              </div>

              <div>
                {label("Reference Number #")}
                <Textfield
                  placeholder="Add reference number"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.currentTarget.value)}
                />
              </div>

              <div>
                {label("Manufacturing Company")}
                <Textfield
                  placeholder="Add manufacturing company"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.currentTarget.value)}
                />
              </div>

              <div>
                {label("Lot Number")}
                <Textfield
                  placeholder="Add lot number"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.currentTarget.value)}
                />
              </div>

              {/* Unit of Measure + Typical Shelf Life side by side */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {label("Unit of Measure", true, errors.unitOfMeasure)}
                  <div style={{ position: "relative" }}>
                    <select
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.currentTarget.value)}
                      style={selectStyle(!!unitOfMeasure)}
                    >
                      <option value="">Select Unit</option>
                      <option value="each">Each</option>
                      <option value="box">Box</option>
                      <option value="case">Case</option>
                      <option value="pack">Pack</option>
                      <option value="unit">Unit</option>
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B778C", fontSize: 12 }}>▾</span>
                  </div>
                </div>
                <div>
                  {label("Typical Shelf Life")}
                  <Textfield
                    placeholder="Add Shelf Life"
                    value={typicalShelfLife}
                    onChange={(e) => setTypicalShelfLife(e.currentTarget.value)}
                  />
                </div>
              </div>

              <div>
                {label("Expiration Date", true, errors.expirationDate)}
                <Textfield
                  type="date"
                  placeholder="Select date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.currentTarget.value)}
                />
              </div>

              <div>
                {label("Location", true, errors.location)}
                <div style={{ position: "relative" }}>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.currentTarget.value)}
                    style={selectStyle(!!location)}
                  >
                    <option value="">Select Location</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="clinic">Clinic</option>
                    <option value="storage">Storage</option>
                    <option value="other">Other</option>
                  </select>
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B778C", fontSize: 12 }}>▾</span>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2 */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Market Value per Unit */}
              <div>
                {label("Market Value per Unit", true, errors.marketValue)}
                <Textfield
                  placeholder="Add market value"
                  value={marketValue}
                  onChange={(e) => setMarketValue(e.currentTarget.value)}
                  elemBeforeInput={
                    <span style={{ marginLeft: 8, display: "flex", alignItems: "center", color: "#6B778C", flexShrink: 0 }}>
                      <CameraIcon label="" size="small" />
                    </span>
                  }
                />
              </div>

              {/* Valuation Source */}
              <div>
                {label("Valuation Source")}
                <div style={{ borderRadius: 3, outline: isFilled ? "2px dashed #0052CC" : "none" }}>
                  <Textfield
                    placeholder="Add a valuation source"
                    value={valuationSource}
                    onChange={(e) => setValuationSource(e.currentTarget.value)}
                    elemBeforeInput={
                      <span style={{ marginLeft: 8, display: "flex", alignItems: "center", color: "#6B778C", flexShrink: 0 }}>
                        <LinkIcon label="" size="small" />
                      </span>
                    }
                  />
                </div>
              </div>

              <ValuationSuggestedSources
                searchQuery={itemDescription}
                valuationSource={valuationSource}
                onValuationSourceChange={setValuationSource}
                sectionLabel="AI Suggested Sources"
              />

              {/* Acquisition Method */}
              <div style={{ borderRadius: 4, outline: isFilled ? "2px dashed #0052CC" : "none", padding: isFilled ? 12 : 0 }}>
                {label("Acquisition Method", true, errors.acquisitionMethod)}
                <div style={{ position: "relative" }}>
                  <select
                    value={acquisitionMethod}
                    onChange={(e) => setAcquisitionMethod(e.currentTarget.value)}
                    style={selectStyle(!!acquisitionMethod)}
                  >
                    <option value="">Select acquisition method</option>
                    <option value="donation">Donation</option>
                    <option value="purchase">Purchase</option>
                    <option value="grant">Grant</option>
                    <option value="loan">Loan</option>
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6B778C", fontSize: 12 }}>▾</span>
                </div>
              </div>

              {/* Upload Document */}
              <div style={{ borderRadius: 4, outline: isFilled ? "2px dashed #0052CC" : "none", padding: isFilled ? 12 : 0 }}>
                {label("Upload Document")}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileSelect(file);
                  }}
                  style={{
                    border: `1.5px dashed ${isDragOver ? "#0052CC" : "#C1C7D0"}`,
                    borderRadius: 4,
                    padding: "16px",
                    backgroundColor: isDragOver ? "#DEEBFF" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: uploadedFile ? 12 : 0,
                    transition: "background-color 0.15s",
                  }}
                >
                  <span style={{ color: "#6B778C", fontSize: 13 }}>↑ Drop files to attach or</span>
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

                {uploadedFile && (
                  <div style={{ display: "inline-block", width: 160, borderRadius: 6, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", backgroundColor: "white" }}>
                    <div style={{
                      height: 96,
                      background: uploadedFile.preview
                        ? `url(${uploadedFile.preview}) center/cover`
                        : "linear-gradient(135deg, #7B61FF 0%, #C56DED 50%, #4FC3F7 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {!uploadedFile.preview && <span style={{ fontSize: 36 }}>📄</span>}
                    </div>
                    <div style={{ padding: "8px 10px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#172B4D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {uploadedFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B778C", marginTop: 2 }}>{uploadedFile.date}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #DFE1E6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button appearance="subtle" onClick={onClose}>Cancel</Button>
          <div style={{ display: "flex", gap: 8 }}>
            {step === 2 && (
              <Button appearance="subtle" onClick={() => setStep(1)}>
                ← Back
              </Button>
            )}
            <Button appearance="primary" isLoading={isSaving} onClick={handleNext}>
              {step === 2 ? "Submit" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
