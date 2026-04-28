"use client";

import React, { useMemo, useState } from "react";

interface Column {
  key: string;
  header: React.ReactNode;
  width?: number;
}

interface Row {
  key: string;
  cells: React.ReactNode[];
}

interface Props {
  columns: Column[];
  rows: Row[];
  rowsPerPage?: number;
  defaultPage?: number;
}

/* ---------------- SMALL STATUS BADGE ---------------- */
function StatusBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 36,
          height: 22,
          borderRadius: 6,
          border: "1px solid #E0E0E0",
          fontSize: 12,
          color: "#888",
          background: "#fff",
        }}
      >
        —
      </span>
    );
  }

  const isPositive = value > 0;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 44,
        height: 22,
        borderRadius: 6,
        background: isPositive ? "#CFF5C7" : "#FFD2CD",
        color: isPositive ? "#1F6B12" : "#7A1A15",
        fontWeight: 700,
        fontSize: 12,
        padding: "0 6px",
      }}
    >
      {isPositive ? `+${value}` : value}
    </span>
  );
}

/* ---------------- PAGINATION BUTTON ---------------- */
function PageBtn({
  label,
  active,
  disabled,
  onClick,
}: {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: active ? "1.5px solid #6B5FD6" : "none",
        background: active ? "#fff" : "transparent",
        color: active ? "#6B5FD6" : "#2D3648",
        fontSize: 13,
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );
}

/* ---------------- MAIN TABLE ---------------- */
export default function ScrollablePaginatedTable({
  columns,
  rows,
  rowsPerPage = 5,
  defaultPage = 1,
}: Props) {
  const [page, setPage] = useState(defaultPage);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* TABLE */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "max-content",
            minWidth: "100%",
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#505258",
                    borderBottom: "1px solid #E5E7EB",
                    width: col.width,
                    whiteSpace: "nowrap",
                    background: "#FFFFFF",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((row, rowIdx) => (
              <tr key={row.key}>
                {row.cells.map((cell, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: "10px 10px",
                      fontSize: 13,
                      color: "#505258",
                      borderBottom:
                        rowIdx < paginatedRows.length - 1
                          ? "1px solid #F1F3F5"
                          : "none",
                      whiteSpace: "nowrap",
                      background: "#FFFFFF",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
      style={{
          height: "1px",
          background: "#E6E8F0",
          marginTop: 6,
          marginBottom: 10,
      }}
      />


      {/* PAGINATION */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <PageBtn
          label="‹"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        />

        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          return (
            <PageBtn
              key={p}
              label={p}
              active={page === p}
              onClick={() => setPage(p)}
            />
          );
        })}

        <PageBtn
          label="›"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>
    </div>
  );
}