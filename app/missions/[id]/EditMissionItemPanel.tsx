"use client";

import { useEffect, useState } from "react";
import Button from "@atlaskit/button/new";
import SidePanel, { PanelLabel } from "@/components/SidePanel";
import { updateMissionItem, updateMissionItemBag, updateMissionItemStatus } from "../actions";
import { overlayStyle, popupStyle } from "../panelStyles";
import { useAuthUser } from "@/app/hooks/authUser";

type ItemStatus = "TO RETURN" | "RETURNED" | "USED";

type MissionItem = {
  id: number;
  quantity_used: number;
  bag_number?: number | null;
  status?: ItemStatus | null;
  inventory: {
    item_description?: string;
    manufacturer?: string;
    reference_number?: string;
  } | null;
};

type Props = {
  isOpen: boolean;
  item: MissionItem | null;
  isArchived: boolean;
  onClose: () => void;
  onSaved: (updated: Pick<MissionItem, "id" | "quantity_used" | "bag_number" | "status">) => void;
};


const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "2px solid #dfe1e6",
  borderRadius: 3,
  fontSize: 14,
  color: "#172b4d",
  backgroundColor: "#fafbfc",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b778c'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
};

export default function EditMissionItemPanel({ isOpen, item, isArchived, onClose, onSaved }: Props) {
  const [quantity, setQuantity] = useState(0);
  const [bagNumber, setBagNumber] = useState<string>("");
  const [status, setStatus] = useState<ItemStatus | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { user } = useAuthUser();

  // Pre-fill fields when panel opens
  useEffect(() => {
    if (isOpen && item) {
      setQuantity(item.quantity_used ?? 0);
      setBagNumber(item.bag_number != null ? String(item.bag_number) : "");
      setStatus(item.status ?? "");
    }
  }, [isOpen, item]);

  async function handleSave() {
    if (!item) return;
    if (user?.user_metadata?.role !== "admin") {
      setErrorMsg("You do not have permission to edit items.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        updateMissionItem(item.id, quantity),
        updateMissionItemBag(item.id, bagNumber ? parseInt(bagNumber) : null),
        updateMissionItemStatus(item.id, status || null),
      ]);
      onSaved({ id: item.id, quantity_used: quantity, bag_number: bagNumber ? parseInt(bagNumber) : null, status: status || null });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      label="Edit Item"
      title="Edit Item"
      subtitle={item?.inventory?.item_description ?? ""}
      footerLeft={<span />}
      footerRight={<span />}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 16 }}>

        {/* Read-only inventory info */}
        <div style={{ backgroundColor: "#f4f5f7", borderRadius: 4, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {item?.inventory?.manufacturer && (
            <div style={{ fontSize: 13, color: "#42526e" }}>
              <span style={{ fontWeight: 600 }}>Manufacturer: </span>{item.inventory.manufacturer}
            </div>
          )}
          {item?.inventory?.reference_number && (
            <div style={{ fontSize: 13, color: "#42526e" }}>
              <span style={{ fontWeight: 600 }}>Ref #: </span>{item.inventory.reference_number}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <PanelLabel required>Quantity Used</PanelLabel>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            style={inputStyle}
          />
        </div>

        {/* Bag Number */}
        <div>
          <PanelLabel>Bag Number</PanelLabel>
          <input
            type="number"
            min={1}
            placeholder="—"
            value={bagNumber}
            onChange={(e) => setBagNumber(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Status */}
        <div>
          <PanelLabel>Status</PanelLabel>
          <select
            value={status}
            disabled={!isArchived}
            onChange={(e) => setStatus(e.target.value as ItemStatus | "")}
            style={{ ...selectStyle, opacity: isArchived ? 1 : 0.5, cursor: isArchived ? "pointer" : "not-allowed" }}
          >
            <option value="">— None —</option>
            <option value="TO RETURN">TO RETURN</option>
            <option value="RETURNED">RETURNED</option>
            <option value="USED">USED</option>
          </select>
          {!isArchived && (
            <p style={{ fontSize: 12, color: "#6b778c", marginTop: 4 }}>
              Status can only be set once the mission is archived.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e4e6ea", paddingTop: 12, marginTop: 24 }}>
        <Button appearance="subtle" onClick={onClose} isDisabled={saving}>Cancel</Button>
        <Button appearance="primary" isLoading={saving} onClick={handleSave}>Save Changes</Button>
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
