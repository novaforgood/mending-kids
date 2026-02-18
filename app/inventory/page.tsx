"use client";

import { useEffect, useState } from "react";
import { InventoryItem } from "./types";
import InventoryTable from "./utils/InventoryTable";
import AddItemPanel from "./utils/AddItemPanel";
import { fetchInventory } from "./actions";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      const data = await fetchInventory();
      const parsedData = data.map((item: any) => ({
        ...item,
        expiration: item.expiration ? new Date(item.expiration) : new Date(),
      }));
      setItems(parsedData);
    } catch {
      setError("Failed to load inventory");
    }
  }

  const handleAdd = () => {
    setIsPanelOpen(true);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Inventory</h1>

      {error && <div style={{ color: "#DE350B", marginBottom: 12 }}>{error}</div>}

      <InventoryTable
        items={items}
        onAdd={handleAdd}
        onEdit={(item) => console.log("Edit item", item)}
      />

      <AddItemPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        items={items}
        setItems={setItems}
        setError={setError}
      />
    </div>
  );
}
