"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@atlaskit/dynamic-table";
import Button from "@atlaskit/button/new/";
import { IconButton } from "@atlaskit/button/new";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import MoreIcon from "@atlaskit/icon/core/show-more-horizontal";

import { fetchInventory, addItem, deleteItem, updateItemDocumentation } from "./actions";
import DocumentationModal from "./documentation-modal";
import AddItemPanel from "./add-item-panel";

type InventoryItem = {
  id: number;
  created_at: string;
  item_description: string;
  manufacturer: string;
  reference_number: string;
  lot_number: string | null;
  unit_of_measure: string | null;
  typical_shelf_life: string | null;
  location: string | null;
  quantity: number;
  status: string;
  mission: string;
  expiration: Date;
  market_value_per_unit: number;
  total_value: number;
  valuation_source: string | null;
  acquisition_method: string | null;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

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

  useEffect(() => {
    loadInventory();
  }, []);

  async function handlePanelSave(payload: Parameters<typeof addItem>[0]) {
    setIsSaving(true);
    setError(null);
    try {
      await addItem(payload);
      await loadInventory();
      setIsPanelOpen(false);
    } catch {
      setError("Failed to add item");
    } finally {
      setIsSaving(false);
    }
  }

  const head = {
    cells: [
      { key: "item_description", content: "Item Description", isSortable: true },
      { key: "manufacturer", content: "Manufacturing Company", isSortable: true },
      { key: "reference_number", content: "Reference Number", isSortable: true },
      { key: "quantity", content: "Quantity", isSortable: true },
      { key: "status", content: "Status" },
      { key: "mission", content: "Mission" },
      { key: "expiration", content: "Expiration", isSortable: true },
      { key: "market_value_per_unit", content: "Value / Unit", isSortable: true },
      { key: "total_value", content: "Total", isSortable: true },
      { key: "valuation_source", content: "Valuation Source" },
      { key: "acquisition_method", content: "Acquisition Method" },
      { key: "actions", content: "Actions", isSortable: false },
    ],
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey as keyof InventoryItem];
    const bVal = b[sortKey as keyof InventoryItem];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "ASC" ? aVal - bVal : bVal - aVal;
    }
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortOrder === "ASC"
        ? aVal.getTime() - bVal.getTime()
        : bVal.getTime() - aVal.getTime();
    }
    return sortOrder === "ASC"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const rows = sortedItems.map((item) => ({
    key: String(item.id),
    cells: [
      { content: item.item_description },
      { content: item.manufacturer },
      { content: item.reference_number },
      { content: item.quantity },
      { content: item.status },
      { content: item.mission },
      { content: item.expiration.toLocaleDateString() },
      { content: `$${item.market_value_per_unit.toFixed(2)}` },
      { content: `$${item.total_value.toFixed(2)}` },
      {
        content: item.valuation_source ? (
          <a
            href={item.valuation_source}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0052CC", fontSize: 13 }}
          >
            {item.valuation_source}
          </a>
        ) : (
          <span style={{ color: "#6B778C" }}>—</span>
        ),
      },
      { content: item.acquisition_method ?? <span style={{ color: "#6B778C" }}>—</span> },
      {
        content: (
          <div style={{ display: "flex", gap: 8 }}>
            <IconButton
              icon={AddIcon}
              label="Add"
              onClick={() => console.log("Add item", item.id)}
            />
            <IconButton
              icon={EditIcon}
              label="Edit"
              onClick={() => {
                setSelectedItemId(item.id);
                setIsDocumentationModalOpen(true);
              }}
            />
            <IconButton
              icon={MoreIcon}
              label="More"
              onClick={() => console.log("More options for item", item.id)}
            />
          </div>
        ),
      },
    ],
  }));

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Inventory</h1>
        <Button
          appearance="primary"
          iconBefore={AddIcon}
          onClick={() => setIsPanelOpen(true)}
        >
          Add Item
        </Button>
      </div>

      {error && (
        <div style={{ color: "#DE350B", marginBottom: 12 }}>{error}</div>
      )}

      <DynamicTable
        head={head}
        rows={rows}
        sortKey={sortKey ?? undefined}
        sortOrder={sortOrder}
        onSort={({ key, sortOrder }) => {
          setSortKey(key);
          setSortOrder(sortOrder);
        }}
        rowsPerPage={10}
        defaultPage={1}
        emptyView={
          <div style={{ padding: 16, textAlign: "center", color: "#6B778C" }}>
            No inventory items yet
          </div>
        }
      />

      {/* Documentation modal for editing existing rows */}
      <DocumentationModal
        isOpen={isDocumentationModalOpen}
        preSelectedItemId={selectedItemId}
        items={items.map((i) => ({
          id: i.id,
          label: i.item_description || i.reference_number,
          market_value_per_unit: i.market_value_per_unit,
          valuation_source: i.valuation_source,
          acquisition_method: i.acquisition_method,
        }))}
        onClose={() => {
          setIsDocumentationModalOpen(false);
          setSelectedItemId(null);
        }}
        onNext={async (
          itemId: number,
          marketValue: number,
          valuationSource: string,
          acquisitionMethod: string
        ) => {
          await updateItemDocumentation(
            itemId,
            marketValue,
            valuationSource,
            acquisitionMethod
          );
          await loadInventory();
          setIsDocumentationModalOpen(false);
          setSelectedItemId(null);
        }}
      />

      {/* Add Item side panel */}
      <AddItemPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handlePanelSave}
        isSaving={isSaving}
      />
    </div>
  );
}
