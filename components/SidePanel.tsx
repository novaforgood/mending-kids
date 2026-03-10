"use client";

import React from "react";
import Drawer from "@atlaskit/drawer";
import Button from "@atlaskit/button/new";

// ─── Shared label primitives ─────────────────────────────────────────────────

export const panelLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#172b4d",
  display: "block",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export function PanelLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label style={panelLabelStyle}>
      {children}
      {required && <span style={{ color: "#de350b", marginLeft: 2 }}>*</span>}
    </label>
  );
}

// ─── SidePanel ────────────────────────────────────────────────────────────────

type SidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Atlaskit accessibility label */
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Replaces the left side of the footer (defaults to a Cancel button) */
  footerLeft?: React.ReactNode;
  /** Replaces the right side of the footer entirely */
  footerRight?: React.ReactNode;
  /** Shorthand: label for the primary submit button */
  submitLabel?: string;
  onSubmit?: () => void;
  isLoading?: boolean;
  submitDisabled?: boolean;
  onCancel?: () => void;
};

export default function SidePanel({
  isOpen,
  onClose,
  label,
  title,
  subtitle,
  children,
  footerLeft,
  footerRight,
  submitLabel = "Save",
  onSubmit,
  isLoading,
  submitDisabled,
  onCancel,
}: SidePanelProps) {
  const handleCancel = onCancel ?? onClose;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="medium" label={label}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          padding: "32px 0 32px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            paddingBottom: 12,
            borderBottom: "1px solid #e4e6ea",
            paddingRight: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#172b4d" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b778c" }}>{subtitle}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 16 }}>{children}</div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e4e6ea",
            paddingTop: 12,
            paddingRight: 16,
            marginTop: 12,
          }}
        >
          {footerLeft ?? (
            <Button appearance="subtle" onClick={handleCancel} isDisabled={isLoading}>
              Cancel
            </Button>
          )}
          {footerRight ?? (
            <Button
              appearance="primary"
              onClick={onSubmit}
              isLoading={isLoading}
              isDisabled={submitDisabled}
            >
              {submitLabel}
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
