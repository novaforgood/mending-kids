"use client";

import { useEffect, useState } from "react";
import DynamicTable from "@atlaskit/dynamic-table";
import Button from "@atlaskit/button/new/";
import CustomButton from "./components/custom-button";
import { IconButton } from "@atlaskit/button/new";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import MoreIcon from "@atlaskit/icon/core/show-more-horizontal";
import DownloadIcon from "@atlaskit/icon/core/arrow-down";

import { fetchInventory, addItem, updateItemDocumentation } from "./utils/actions";
import DocumentationModal from "./components/documentation-modal";
import AddItemPanel from "./components/add-item-panel";

import { InventoryItem } from "./utils/types";
import ViewEditPanel from "./ViewEditPanel";
import { supabase } from "@/lib/supabase/supabaseClient";

import { useAuthUser } from "../hooks/authUser";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("anonymous");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: "csv" | "pdf") {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/inventory/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  }

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");

  const [selectedTab, setSelectedTab] = useState<"active" | "archived">("active");

  const { user, loading } = useAuthUser();

  useEffect(() => {
    loadInventory();
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
    }
  }

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

  async function handlePanelSave(payload: Parameters<typeof addItem>[0]) {
    setIsSaving(true);
    setError(null);
    try {
      await addItem(payload, userEmail);
      await loadInventory();
      setIsPanelOpen(false);
    } catch {
      setError("Failed to add item");
    } finally {
      setIsSaving(false);
    }
  }

  const Cell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {children}
    </div>
  );

  const head = {
    cells: [
      { key: "item_description", content: "Item Description", isSortable: true, width: 200 },
      { key: "manufacturer", content: "Manufacturer", isSortable: true, width: 150 },
      { key: "reference_number", content: "Reference Number", isSortable: true, width: 150 },
      { key: "quantity", content: "Quantity", isSortable: true, width: 100 },
      { key: "status", content: "Status", width: 120 },
      { key: "location", content: "Location", width: 120 },
      { key: "expiration", content: "Expiration", isSortable: true, width: 140 },
      { key: "actions", content: "Actions", width: 120 },
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
      ? String(aVal).localeCompare(String(aVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const activeItems = sortedItems.filter((item) => {
    if (item.status === "archived") return false;
    if (item.expiration && item.expiration < new Date()) return false;
    return true;
  });

  const archivedItems = sortedItems.filter((item) => {
    if (item.status === "archived") return true;
    if (item.expiration && item.expiration < new Date()) return true;
    return false;
  });

  const createRows = (data: InventoryItem[]) =>
    data.map((item) => ({
      key: String(item.id),
      cells: [
        { content: <Cell>{item.item_description}</Cell> },
        { content: <Cell>{item.manufacturer}</Cell> },
        { content: <Cell>{item.reference_number}</Cell> },
        { content: <Cell>{item.quantity}</Cell> },
        { content: <Cell>{item.status}</Cell> },
        { content: <Cell>{item.location}</Cell> },
        { content: <Cell>{item.expiration.toLocaleDateString()}</Cell> },
        {
          content: (
            <div style={{ display: "flex", gap: 8 }}>
              <IconButton icon={AddIcon} label="Add" />
              <IconButton
                icon={EditIcon}
                label="Edit"
                onClick={() => {
                  setSelectedItem(item);
                  setPanelMode("view");
                  setIsViewPanelOpen(true);
                }}
              />
              <IconButton icon={MoreIcon} label="More" />
            </div>
          ),
        },
      ],
    }));

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Inventory</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            appearance="subtle"
            iconBefore={DownloadIcon}
            isDisabled={isExporting}
            onClick={() => handleExport("csv")}
          >
            Export CSV
          </Button>
          <Button
            appearance="subtle"
            iconBefore={DownloadIcon}
            isDisabled={isExporting}
            onClick={() => handleExport("pdf")}
          >
            Export PDF
          </Button>
          <CustomButton backgroundColor="#422670" textColor="#FFFFFF" iconBefore={<AddIcon label="" />} onClick={() => setIsPanelOpen(true)}>
            Add Item
          </CustomButton>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #DFE1E6", gap: 16 }}>
          {["active", "archived"].map((tab) => (
            <div
              key={tab}
              onClick={() => setSelectedTab(tab as "active" | "archived")}
              style={{
                padding: "8px 50px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "16px",
                borderBottom: selectedTab === tab ? "2px solid #5137A2" : "none",
                color: selectedTab === tab ? "#5137A2" : "#172B4D",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ color: "#DE350B" }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <DynamicTable
          head={head}
          rows={createRows(selectedTab === "active" ? activeItems : archivedItems)}
          sortKey={sortKey ?? undefined}
          sortOrder={sortOrder}
          onSort={({ key, sortOrder }) => {
            setSortKey(key);
            setSortOrder(sortOrder);
          }}
          rowsPerPage={10}
          defaultPage={1}
          isFixedSize
          emptyView={
            <div style={{ padding: 16, textAlign: "center", color: "#6B778C" }}>
              {selectedTab === "active" ? "No active items" : "No archived items"}
            </div>
          }
        />
      </div>

      <ViewEditPanel
        isOpen={isViewPanelOpen}
        onClose={() => setIsViewPanelOpen(false)}
        item={selectedItem}
        // mode={panelMode}
        setItems={setItems}
      />

      <AddItemPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSave={handlePanelSave}
        isSaving={isSaving}
      />

      <DocumentationModal
        isOpen={false}
        preSelectedItemId={selectedItem?.id ?? null}
        items={items.map((i) => ({
          id: i.id,
          label: i.item_description || i.reference_number,
          market_value_per_unit: i.market_value_per_unit,
          valuation_source: i.valuation_source,
          acquisition_method: i.acquisition_method,
        }))}
        onClose={() => {}}
        onNext={async (itemId, marketValue, valuationSource, acquisitionMethod) => {
          await updateItemDocumentation(itemId, marketValue, valuationSource, acquisitionMethod, userEmail);
          await loadInventory();
        }}
      />
    </div>
  );
}