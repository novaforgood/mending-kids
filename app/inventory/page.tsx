"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomDynamicTable from "./components/custom-dynamic-table";
import CustomButton from "./components/custom-button";
import { IconButton } from "@atlaskit/button/new";
import CustomLozenge from "./components/custom-lozenge";
import DropdownMenu, {
  DropdownItem,
  DropdownItemGroup,
} from "@atlaskit/dropdown-menu";
import CustomDatePicker from "./components/CustomDatePicker";
import AddQuantityModal from "./components/AddQuantityModal";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import MoreIcon from "@atlaskit/icon/core/show-more-horizontal";
import ChevronDownIcon from '@atlaskit/icon/core/chevron-down';
import FilterIcon from '@atlaskit/icon/core/filter';
import SearchIcon from '@atlaskit/icon/core/search';

import { fetchInventory, addItem, updateItemDocumentation, updateItemDetails, deleteItem, addItemQuantity } from "./utils/actions";
import { fetchMissions } from "@/app/missions/actions";
import DocumentationModal from "./components/documentation-modal";
import AddItemPanel from "./components/add-item-panel";

import { InventoryItem } from "./utils/types";
import ViewEditPanel from "./ViewEditPanel";
import { supabaseBrowser as supabase } from "@/lib/supabase/client";


export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | null>(null);

  const [isViewPanelOpen, setIsViewPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectionClearSignal, setSelectionClearSignal] = useState(0);

  const [selectedTab, setSelectedTab] = useState<"active" | "archived">("active");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMission, setSelectedMission] = useState("");
  const [selectedExpiration, setSelectedExpiration] = useState("");

  const [isMissionsDropdownOpen, setIsMissionsDropdownOpen] = useState(false);
  const [itemForAssignment, setItemForAssignment] = useState<InventoryItem | null>(null);
  const [availableMissions, setAvailableMissions] = useState<Array<{ id: number; mission_name: string }>>([]);
  const [addQuantityItem, setAddQuantityItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    loadInventory();
    getUser();
    loadMissions();
  }, []);

  async function loadMissions() {
    try {
      const missions = await fetchMissions();
      setAvailableMissions(missions.map((m: { id: number; mission_name: string }) => ({ id: m.id, mission_name: m.mission_name })));
    } catch {
      setAvailableMissions([]);
    }
  }

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
        expiration: item.expiration ? new Date(item.expiration) : null,
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

  const renderHeaderContent = (
    label: string,
    isSortable = false
  ) => {
    const showDefaultSortIcon = isSortable && !sortKey && !sortOrder;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>{label}</span>
        {showDefaultSortIcon ? (
          <FilterIcon label="Default sort" size="small" />
        ) : null}
      </div>
    );
  };

  const head = {
    cells: [
      { key: "item_description", content: renderHeaderContent("Item Description", true), isSortable: true, width: 200 },
      { key: "manufacturer", content: renderHeaderContent("Manufacturer", true), isSortable: true, width: 150 },
      { key: "reference_number", content: renderHeaderContent("Reference Number", true), isSortable: true, width: 150 },
      { key: "quantity", content: renderHeaderContent("Quantity", true), isSortable: true, width: 100 },
      { key: "location", content: renderHeaderContent("Location", true), isSortable: true, width: 120 },
      { key: "expiration", content: renderHeaderContent("Expiration", true), isSortable: true, width: 140 },
      { key: "actions", content: renderHeaderContent("Actions", false), width: 120 },
    ],
  };

  const parseExpirationString = (value: string): Date | null => {
    if (!value) return null;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return new Date(`${value}T23:59:59.999`);
    }

    const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T23:59:59.999`);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortKey || !sortOrder) return 0;
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

    const aString = aVal == null ? "" : String(aVal);
    const bString = bVal == null ? "" : String(bVal);

    return sortOrder === "ASC"
      ? aString.localeCompare(bString)
      : bString.localeCompare(aString);
  });

  const missionOptions = Array.from(
    new Set(
      items
        .flatMap((i) =>
          i.mission_inventory?.map((mi) => mi.missions?.mission_name).filter((m): m is string => Boolean(m)) ?? []
        )
        .filter(Boolean)
    )
  );

  // Get available missions with their IDs
  const availableMissionsWithIds = Array.from(
    new Map(
      items
        .flatMap((i) =>
          i.mission_inventory?.map((mi) => [
            mi.mission_id,
            mi.missions?.mission_name ?? "Unknown",
          ]) ?? []
        )
        .entries()
    )
  ).map(([id, name]) => ({ id, name }));

  const handleAssignToMission = () => {
    if (selectedItem) {
      setItemForAssignment(selectedItem);
      setIsMissionsDropdownOpen(true);
    }
  };

  const handleMissionSelect = (missionId: number) => {
    if (itemForAssignment) {
      router.push(`/missions/${missionId}/add-items?preSelectedItemId=${itemForAssignment.id}`);
      setIsMissionsDropdownOpen(false);
      setIsViewPanelOpen(false);
    }
  };

  const filteredItems = sortedItems.filter((item) => {
    const missionNames =
      item.mission_inventory?.map((mi) => mi.missions?.mission_name).filter((m): m is string => Boolean(m)) ?? [];

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
        : parseExpirationString(selectedExpiration);

    const matchesExpiration =
      expirationFilter === null ||
      item.expiration === null ||
      item.expiration <= expirationFilter;

    return matchesSearch && matchesMission && matchesExpiration;
  });

  const activeItems = filteredItems.filter((item) => item.active);

  const archivedItems = filteredItems.filter((item) => !item.active);

  const createRows = (data: InventoryItem[]) =>
    data.map((item) => {
      return {
        key: String(item.id),
        item,
        cells: [
          { content: <Cell>{item.item_description}</Cell> },

          { content: <Cell>{item.manufacturer}</Cell> },

          { content: <Cell>{item.reference_number}</Cell> },

          {
            content: (
              <Cell>
                <CustomLozenge>{item.quantity}</CustomLozenge>
              </Cell>
            ),
          },

          { content: <Cell>{item.location}</Cell> },

          {
            content: (
              <Cell>
                {item.expiration ? item.expiration.toLocaleDateString() : "—"}
              </Cell>
            ),
          },

          {
            content: (
              <div
                style={{ display: "flex", gap: 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton
                  icon={AddIcon}
                  label="Add"
                  onClick={() => setAddQuantityItem(item)}
                />

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
                        await updateItemDetails(item.id, { active: !item.active }, userEmail);
                        await loadInventory();
                      }}
                    >
                      {item.active
                        ? "Archive"
                        : "Unarchive"}
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
      };
    });

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
                  <ChevronDownIcon label="" />
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #8C8F97",
              borderRadius: 6,
              padding: "0 10px",
              width: 240,
              background: "white",
            }}
          >
            <SearchIcon label="Search" size="small" />

            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: 13,
                padding: "6px 8px",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>

      {error && <div style={{ color: "#DE350B" }}>{error}</div>}

      <div style={{ overflowX: "auto" }}>
        <CustomDynamicTable
          head={head}
          rows={createRows(selectedTab === "active" ? activeItems : archivedItems)}
          sortKey={sortKey ?? undefined}
          sortOrder={sortOrder ?? undefined}
          onSort={({ key }) => {
            if (sortKey !== key) {
              setSortKey(key);
              setSortOrder("ASC");
              return;
            }

            if (sortOrder === "ASC") {
              setSortOrder("DESC");
              return;
            }

            if (sortOrder === "DESC") {
              setSortKey(null);
              setSortOrder(null);
              return;
            }

            setSortKey(key);
            setSortOrder("ASC");
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
          clearSelectionTrigger={selectionClearSignal}

        />      
      </div>

      <ViewEditPanel
        isOpen={isViewPanelOpen}
        onClose={() => {
          setIsViewPanelOpen(false);
          setSelectedItem(null);
          setSelectionClearSignal((s) => s + 1);
        }}
        item={selectedItem}
        setItems={setItems}
        onAssignToMission={handleAssignToMission}
      />

      {/* Missions Dropdown Overlay */}
      {isMissionsDropdownOpen && availableMissionsWithIds.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
          onClick={() => setIsMissionsDropdownOpen(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              minWidth: 300,
              maxWidth: 500,
              maxHeight: 400,
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #DFE1E6",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Select a Mission to Assign To
            </div>
            <div>
              {availableMissionsWithIds.map((mission) => (
                <div
                  key={mission.id}
                  onClick={() => handleMissionSelect(mission.id)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid #F1F2F4",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F7F8F9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {mission.name}
                </div>
              ))}
              {availableMissionsWithIds.length === 0 && (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#6B778C",
                    fontSize: 13,
                  }}
                >
                  No active missions available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {addQuantityItem && (
        <AddQuantityModal
          itemDescription={addQuantityItem.item_description}
          onConfirm={async (qty, notes) => {
            await addItemQuantity(addQuantityItem.id, qty, notes, userEmail);
            await loadInventory();
            setAddQuantityItem(null);
          }}
          onClose={() => setAddQuantityItem(null)}
        />
      )}


    </div>
  );
}