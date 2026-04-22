"use client";

import { useEffect, useRef, useState } from "react";

export type DateFilter = "today" | "yesterday" | "last-week" | "last-month" | null;

const LABELS: Record<NonNullable<DateFilter>, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "last-week": "Last Week",
  "last-month": "Last Month",
};

const OPTIONS = ["today", "yesterday", "last-week", "last-month"] as const;

export function isWithinDateFilter(created_at: string, filter: DateFilter): boolean {
  if (!filter) return true;
  const date = new Date(created_at);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  switch (filter) {
    case "today":
      return date >= startOfToday;
    case "yesterday":
      return date >= startOfYesterday && date < startOfToday;
    case "last-week":
      return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "last-month":
      return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

interface Props {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

export function DateFilterDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg focus:outline-none transition-colors ${
          value
            ? "bg-blue-50 border-blue-400 text-blue-700 font-medium"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {value ? LABELS[value] : "Date"}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === option
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {LABELS[option]}
            </button>
          ))}
          <div className="border-t border-gray-100">
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
