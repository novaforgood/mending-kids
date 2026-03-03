"use client";

import React, { useState } from "react";
import DynamicTable from "@atlaskit/dynamic-table";
import { IconButton } from "@atlaskit/button/new";
import Button from "@atlaskit/button/new";
import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import MoreIcon from "@atlaskit/icon/core/show-more-horizontal";
import GlobeIcon from "@atlaskit/icon/core/globe";
import { InventoryItem } from "../types";
import Lozenge from "@atlaskit/lozenge";

interface InventoryTableProps {
  items: InventoryItem[];
  onAdd: () => void;
  onEdit: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
}

export default function InventoryTable({
  items,
  onAdd,
  onEdit,
  onView,
}: InventoryTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const head = {
    cells: [
      { key: "item_description", content: "Item Description", isSortable: true },
      { key: "manufacturer", content: "Manufacturer", isSortable: true },
      { key: "reference_number", content: "Reference Number", isSortable: true },
      { key: "quantity", content: "Quantity", isSortable: true },
      { key: "status", content: "Status" },
      { key: "mission", content: "Mission" },
      { key: "expiration", content: "Expiration", isSortable: true },
      { key: "market_value_per_unit", content: "Value / Unit", isSortable: true },
      { key: "total_value", content: "Total", isSortable: true },
      { key: "actions", content: "Actions" },
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
      ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
      : String(bVal ?? "").localeCompare(String(aVal ?? ""));
  });

  const rows = sortedItems.map((item) => ({
    key: item.id,
    onClick: () => onView(item), // 👈 clicking row opens view mode
    cells: [
      { content: item.item_description },
      { content: item.manufacturer },
      { content: item.reference_number },
      { content: item.quantity ?? 0 },
      {
        content: item.status ? (
          <Lozenge>{item.status}</Lozenge>
        ) : (
          ""
        ),
      },
      {
        content: item.mission ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <GlobeIcon label="Mission" />
            {item.mission}
          </div>
        ) : (
          ""
        ),
      },
      {
        content: item.expiration
          ? item.expiration.toLocaleDateString()
          : "",
      },
      {
        content: `$${item.market_value_per_unit?.toFixed(2) ?? "0.00"}`,
      },
      {
        content: `$${item.total_value?.toFixed(2) ?? "0.00"}`,
      },
      {
        content: (
          <div style={{ display: "flex", gap: 8 }}>
            {/* <IconButton
              icon={AddIcon}
              label="Add"
            /> */}
            <IconButton
              icon={EditIcon}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            />
            <IconButton
              icon={MoreIcon}
              label="More"
              onClick={(e) => {
                e.stopPropagation();
                console.log("More", item.id);
              }}
            />
          </div>
        ),
      },
    ],
  }));

  return (
    <>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
        <Button appearance="primary" onClick={onAdd}>
          Add Item
        </Button>
      </div>

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
          <div
            style={{
              padding: 16,
              textAlign: "center",
              color: "#6B778C",
            }}
          >
            No inventory items yet
          </div>
        }
      />
    </>
  );
}