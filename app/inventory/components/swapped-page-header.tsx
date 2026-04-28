"use client";

import React from "react";
import Breadcrumbs from "@atlaskit/breadcrumbs";

type Props = {
  breadcrumbs: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
};

export const SwappedPageHeader: React.FC<Props> = ({
  breadcrumbs,
  title,
  actions,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Title */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          lineHeight: 1.2,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#172B4D",
            margin: 0,
          }}
        >
          {title}
        </div>

        {actions && <div>{actions}</div>}
      </div>

      {/* Breadcrumbs */}
      <div style={{ marginTop: 0, lineHeight: 1 }}>
        {breadcrumbs}
      </div>
    </div>
  );
};