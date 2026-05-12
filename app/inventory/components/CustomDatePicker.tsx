"use client";

import { DatePicker } from "@atlaskit/datetime-picker";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import { useRef, useEffect } from "react";

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Expiration",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative", width: 200 }}>
      <style>{`
        [data-testid="datetime-picker--date-picker"] input {
          color: transparent !important;
          font-size: 0 !important;
        }
        [data-testid="datetime-picker--date-picker"] input::placeholder {
          color: transparent !important;
        }
      `}</style>
      {!value && (
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: '#505258',
            fontSize: 14,
            width: 160,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            zIndex: 1,
          }}
        >
          {placeholder}
        </div>
      )}

      <DatePicker
        value={value}
        onChange={(val) => onChange(val)}
        placeholder=" "
        appearance="default"
      />
    </div>
  );
}