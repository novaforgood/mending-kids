"use client";

import { useEffect, useState } from "react";
import CustomDynamicTable from "./components/custom-dynamic-table";
import CustomButton from "./components/custom-button";
import { IconButton } from "@atlaskit/button/new";
import CustomLozenge from "./components/custom-lozenge";
import DropdownMenu, {
  DropdownItem,
  DropdownItemGroup,
} from "@atlaskit/dropdown-menu";
import CustomDatePicker from "./components/CustomDatePicker";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import MoreIcon from "@atlaskit/icon/core/show-more-horizontal";
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down';

import { fetchInventory, addItem, updateItemDocumentation, updateItemDetails, deleteItem } from "./utils/actions";
import DocumentationModal from "./components/documentation-modal";
import AddItemPanel from "./components/add-item-panel";

import { InventoryItem } from "./utils/types";
import ViewEditPanel from "./ViewEditPanel";
import { supabase } from "@/lib/supabase/supabaseClient";


export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("anonymous");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [selectedTab, setSelectedTab] = useState<"active" | "archived">("active");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMission, setSelectedMission] = useState("");
  const [selectedExpiration, setSelectedExpiration] = useState("");

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
      const data = (await fetchInventory()) as InventoryItem[];
      const parsedData = data.map((item) => ({
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

  const missionOptions = Array.from(
    new Set(
      items
        .flatMap((i) =>
          i.mission_inventory?.map((mi) => mi.missions?.mission_name).filter(Boolean) ?? []
        )
        .filter(Boolean)
    )
  );

  const filteredItems = sortedItems.filter((item) => {
    const missionNames =
      item.mission_inventory?.map((mi) => mi.missions?.mission_name).filter(Boolean) ?? [];

    const matchesSearch =
      searchQuery.trim() === "" ||
      item.item_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      missionNames.some((mission) =>
        mission.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesMission =
      selectedMission === "" ||
      missionNames.includes(selectedMission);

    const expirationFilter =
      selectedExpiration === ""
        ? null
        : new Date(`${selectedExpiration}T23:59:59.999`);

    const matchesExpiration =
      expirationFilter === null || item.expiration <= expirationFilter;

    return matchesSearch && matchesMission && matchesExpiration;
  });

  const activeItems = filteredItems.filter((item) => {
    if (item.status === "archived") return false;
    if (item.expiration && item.expiration < new Date()) return false;
    return true;
  });

  const archivedItems = filteredItems.filter((item) => {
    if (item.status === "archived") return true;
    if (item.expiration && item.expiration < new Date()) return true;
    return false;
  });

  const createRows = (data: InventoryItem[]) =>
    data.map((item) => ({
      key: String(item.id),
      item,
      cells: [
        { content: <Cell>{item.item_description}</Cell> },
        { content: <Cell>{item.manufacturer}</Cell> },
        { content: <Cell>{item.reference_number}</Cell> },
        { content: <Cell><CustomLozenge>{item.quantity}</CustomLozenge></Cell> },
        { content: <Cell>{item.location}</Cell> },
        { content: <Cell>{item.expiration.toLocaleDateString()}</Cell> },
        {
          content: (
            <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
              <IconButton icon={AddIcon} label="Add" />
              <IconButton
                icon={EditIcon}
                label="Edit"
                onClick={() => {
                  setSelectedItem(item);
                  setIsViewPanelOpen(true);
                }}
              />
              <DropdownMenu
                trigger={({ triggerRef, ...triggerProps }) => (
                  <IconButton
                    {...triggerProps}
                    ref={triggerRef}
                    icon={MoreIcon}
                    label="More"
                  />
                )}
              >
                <DropdownItemGroup>
                <DropdownItem
                  onClick={async () => {
                    const newStatus = item.status === "archived" ? "active" : "archived";

                    await updateItemDetails(
                      item.id,
                      { status: newStatus },
                      userEmail
                    );

                    await loadInventory();
                  }}
                >
                  {item.status === "archived" ? "Unarchive" : "Archive"}
                </DropdownItem>
                  <DropdownItem
                    onClick={async () => {
                      await deleteItem(item.id, userEmail);
                      console.log("Delete item");
                    }}
                  >
                    Delete
                  </DropdownItem>
                </DropdownItemGroup>
              </DropdownMenu>
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
        <CustomButton backgroundColor="#422670" textColor="#FFFFFF" iconBefore={<AddIcon label="" />} onClick={() => setIsPanelOpen(true)}>
          Add Item
        </CustomButton>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 16,
          borderBottom: "2px solid #DFE1E6",
        }}
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: 16 }}>
          {["active", "archived"].map((tab) => (
            <div
              key={tab}
              onClick={() => setSelectedTab(tab as "active" | "archived")}
              style={{
                padding: "8px 50px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "16px",
                borderBottom: selectedTab === tab ? "3px solid #5137A2" : "none",
                color: selectedTab === tab ? "#5137A2" : "#172B4D",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-2 -mt-3">
          <div style={{ display: "flex" }}>
            <DropdownMenu
              trigger={({ triggerRef, ...triggerProps }) => (
                <button
                  {...triggerProps}
                  ref={triggerRef}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    border: "1px solid #8C8F97",
                    borderRadius: 6,
                    padding: "6px 12px",
                    width: 160,
                    fontSize: 14,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ color: "#505258", fontWeight: 500 }}>
                    {selectedMission || "Mission"}
                  </span>
                  <ChevronDownIcon style={{ color: "#505258" }} />
                </button>
              )}
            >
              <DropdownItemGroup>
                <DropdownItem onClick={() => setSelectedMission("")}>
                  All Missions
                </DropdownItem>

                {missionOptions.map((mission) => (
                  <DropdownItem
                    key={mission}
                    onClick={() => setSelectedMission(mission)}
                  >
                    {mission}
                  </DropdownItem>
                ))}
              </DropdownItemGroup>
            </DropdownMenu>
          </div>

          <div
            style={{
              marginBottom: 4,
              marginTop: -2,
            }}
          >
            <CustomDatePicker
              value={selectedExpiration}
              onChange={setSelectedExpiration}
              placeholder="Expiration"
            />
          </div>

          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "1px solid #8C8F97",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 13,
              width: 240,
              outline: "none",
            }}
          />
        </div>
      </div>

      {error && <div style={{ color: "#DE350B" }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <CustomDynamicTable
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
              {selectedTab === "active"
                ? "No active items"
                : "No archived items"}
            </div>
          }

          onRowClick={(item) => {
            setSelectedItem(item);
            setIsViewPanelOpen(true);
          }}

        />      
      </div>

      <ViewEditPanel
        isOpen={isViewPanelOpen}
        onClose={() => setIsViewPanelOpen(false)}
        item={selectedItem}
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