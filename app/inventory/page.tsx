"use client";

import { useEffect, useState } from "react";
import { InventoryItem } from "./types";
import InventoryTable from "./utils/InventoryTable";
import ViewEditPanel from "./utils/ViewEditPanel";
import AddItemPanel from "./utils/AddItemPanel";
import { fetchInventory } from "./actions";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await fetchInventory();
      const parsedData = data.map((item: any) => ({
        ...item,
        expiration: item.expiration
          ? new Date(item.expiration)
          : new Date(),
      }));
      setItems(parsedData);
    } catch {
      setError("Failed to load inventory");
    }
  }

  const handleAdd = () => {
    setIsAddPanelOpen(true);
  };

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setPanelMode("view");
    setIsViewPanelOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setPanelMode("edit");
    setIsViewPanelOpen(true);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>
        Inventory
      </h1>

      {error && (
        <div style={{ color: "#DE350B", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <InventoryTable
        items={items}
        onAdd={handleAdd}
        onView={handleView}
        onEdit={handleEdit}
      />

      {/* Add Panel */}
      <AddItemPanel
        isOpen={isAddPanelOpen}
        onClose={() => setIsAddPanelOpen(false)}
        items={items}
        setItems={setItems}
        setError={setError}
      />

      {/* View / Edit Panel */}
      <ViewEditPanel
        isOpen={isViewPanelOpen}
        onClose={() => setIsViewPanelOpen(false)}
        item={selectedItem}
        mode={panelMode}
        setItems={setItems}
      />
    </div>
  );
}