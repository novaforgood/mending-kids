"use client";

import React, { useState } from "react";
import DynamicTable from "@atlaskit/dynamic-table";

type HeadCell = {
  key: string;
  content: React.ReactNode;
  isSortable?: boolean;
  width?: number;
};

type RowCell = {
  content: React.ReactNode;
};

type Row<T = any> = {
  key: string;
  cells: RowCell[];

  /* original item */
  item: T;
};

type Props<T = any> = {
  head: {
    cells: HeadCell[];
  };

  rows: Row<T>[];

  sortKey?: string;
  sortOrder?: "ASC" | "DESC";

  onSort?: (args: {
    key: string;
    sortOrder: "ASC" | "DESC";
  }) => void;

  rowsPerPage?: number;
  defaultPage?: number;
  isFixedSize?: boolean;

  emptyView?: React.ReactNode;

  /* COLORS */
  headerTextColor?: string;
  rowBackgroundColor?: string;
  hoverRowColor?: string;
  selectedRowColor?: string;
  textColor?: string;

  /* CLICK */
  onRowClick?: (item: T) => void;
};

export default function CustomDynamicTable<T>({
  head,
  rows,

  sortKey,
  sortOrder,
  onSort,

  rowsPerPage = 10,
  defaultPage = 1,
  isFixedSize = true,

  emptyView,

  headerTextColor = "#505258",

  rowBackgroundColor = "#FFFFFF",

  hoverRowColor = "#F0EBFF",

  selectedRowColor = "#EAE6FF",

  textColor = "#172B4D",

  onRowClick,
}: Props<T>) {
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  const styledHead = {
    cells: head.cells.map((cell) => ({
      ...cell,
      content: (
        <div
          style={{
            color: headerTextColor,
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {cell.content}
        </div>
      ),
    })),
  };

  const styledRows = rows.map((row) => ({
    ...row,

    onClick: () => {
      setSelectedRowKey(row.key);

      if (onRowClick) {
        onRowClick(row.item);
      }
    },

    cells: row.cells.map((cell) => ({
      content: (
        <div
          style={{
            color: textColor,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {cell.content}
        </div>
      ),
    })),

    style: {
      backgroundColor:
        selectedRowKey === row.key
          ? selectedRowColor
          : rowBackgroundColor,

      cursor: onRowClick ? "pointer" : "default",

      transition: "background 0.2s ease",
    },
  }));

  return (
    <div className="custom-dynamic-table-wrapper">
      <style jsx global>{`
        .custom-dynamic-table-wrapper table {
          border-collapse: collapse;
          width: 100%;
        }

        .custom-dynamic-table-wrapper tbody tr:hover {
          background: ${hoverRowColor} !important;
        }
      `}</style>

      <DynamicTable
        head={styledHead}
        rows={styledRows}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={onSort}
        rowsPerPage={rowsPerPage}
        defaultPage={defaultPage}
        isFixedSize={isFixedSize}
        emptyView={emptyView as React.ReactElement}
      />
    </div>
  );
}