"use client";

import React from "react";
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
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(9,30,66,0.54)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 220ms ease",
        }}
      />

      {/* Panel */}
      <div
        aria-label={label}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: 480,
          background: "#fff",
          boxShadow: "-4px 0 16px rgba(0,0,0,0.15)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 280ms cubic-bezier(0.2,0,0,1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "32px 32px 32px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, paddingBottom: 12, borderBottom: "1px solid #e4e6ea" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#172b4d" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b778c" }}>{subtitle}</p>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 0 }}>{children}</div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #e4e6ea",
            paddingTop: 12,
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
    </>
  );
}
