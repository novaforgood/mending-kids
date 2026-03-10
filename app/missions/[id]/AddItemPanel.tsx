"use client";

import React, { useEffect, useState } from "react";
import Button from "@atlaskit/button/new";
import SidePanel from "@/components/SidePanel";
import { addMissionItem, fetchInventory } from "../actions";

type Props = {
  isOpen: boolean;
  missionId: number;
  onClose: () => void;
  onAdded: () => void;
};

type InventoryItem = {
  id: number;
  item_description: string | null;
  manufacturer: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
};

export default function AddItemPanel({ isOpen, missionId, onClose, onAdded }: Props) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelected({});
      fetchInventory().then(setInventory).catch(console.error);
    }
  }, [isOpen]);

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.item_description?.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q)
    );
  });

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const setQty = (id: number, qty: number) => {
    setSelected((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const selectedCount = Object.keys(selected).length;

  const handleAdd = async () => {
    if (selectedCount === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(selected).map(([inventoryId, qty]) =>
          addMissionItem({ mission_id: missionId, inventory_id: Number(inventoryId), quantity: qty })
        )
      );
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      label="Add Items"
      title="Add Items"
      subtitle="Choose from items in current inventory to add to this mission"
      onCancel={onClose}
      footerRight={
        <Button
          appearance="primary"
          onClick={handleAdd}
          isLoading={saving}
          isDisabled={selectedCount === 0}
        >
          Add {selectedCount > 0 ? `${selectedCount} Item${selectedCount > 1 ? "s" : ""}` : "Items"} +
        </Button>
      }
    >
      {/* Search */}
      <div style={{ padding: "12px 0 0 0" }}>
        <div style={{ position: "relative" }}>
          <svg
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#6b778c" }}
            width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              border: "2px solid #dfe1e6",
              borderRadius: 3,
              fontSize: 14,
              color: "#172b4d",
              backgroundColor: "#fafbfc",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: "#f4f5f7", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", width: 32, color: "#6b778c", fontWeight: 600 }} />
              <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Item Description</th>
              <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600 }}>Manufacturer</th>
              <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600, whiteSpace: "nowrap" }}>Avail. Qty</th>
              <th style={{ padding: "8px 10px", color: "#6b778c", fontWeight: 600, whiteSpace: "nowrap" }}>Qty to Add</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#6b778c" }}>Loading…</td>
              </tr>
            )}
            {inventory.length > 0 && filteredInventory.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#6b778c" }}>No items match your search</td>
              </tr>
            )}
            {filteredInventory.map((item) => {
              const isChecked = item.id in selected;
              return (
                <tr
                  key={item.id}
                  style={{ borderTop: "1px solid #f0f0f0", backgroundColor: isChecked ? "#e8f0fe" : "transparent", cursor: "pointer" }}
                  onClick={() => toggleItem(item.id)}
                >
                  <td style={{ padding: "8px 10px" }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleItem(item.id)} onClick={(e) => e.stopPropagation()} style={{ cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "8px 10px", color: "#172b4d" }}>{item.item_description ?? "—"}</td>
                  <td style={{ padding: "8px 10px", color: "#42526e" }}>{item.manufacturer ?? "—"}</td>
                  <td style={{ padding: "8px 10px", color: "#42526e" }}>
                    {item.quantity != null ? `${item.quantity}${item.unit_of_measure ? ` ${item.unit_of_measure}` : ""}` : "—"}
                  </td>
                  <td style={{ padding: "8px 4px" }} onClick={(e) => e.stopPropagation()}>
                    {isChecked && (
                      <input
                        type="number" min={1} value={selected[item.id]}
                        onChange={(e) => setQty(item.id, parseInt(e.target.value) || 1)}
                        style={{ width: 60, padding: "4px 6px", border: "2px solid #0052cc", borderRadius: 3, fontSize: 13, color: "#172b4d" }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SidePanel>
  );
}
