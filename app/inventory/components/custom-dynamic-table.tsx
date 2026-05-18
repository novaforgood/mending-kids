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
  item: T;
};

type Props<T = any> = {
  head: {
    cells: HeadCell[];
  };

  rows: Row<T>[];

  sortKey?: string;
  sortOrder?: "ASC" | "DESC" | undefined;

  onSort?: (args: {
    key: string;
    sortOrder?: "ASC" | "DESC";
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

    /* Pagination buttons */
    .custom-dynamic-table-wrapper nav button {
        color: #422670 !important;
        border-radius: 6px !important;
    }

    /* Hover state */
    .custom-dynamic-table-wrapper nav button:hover {
        background: #F0EBFF !important;
    }

    /* Selected page button */
    .custom-dynamic-table-wrapper nav button[aria-current="page"] {
        background: #EAE6FF !important;
        color: #422670 !important;
        // border: 2px solid #422670 !important;

    }

    /* Selected page text */
    .custom-dynamic-table-wrapper nav button[aria-current="page"] * {
        color: #422670 !important;
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