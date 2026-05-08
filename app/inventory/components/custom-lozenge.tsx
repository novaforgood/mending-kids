import React from "react";

type Appearance =
  | "default"
  | "success"
  | "removed"
  | "unit_stat"
  | "new"
  | "exp"
  | "stat";

interface Props {
  children: React.ReactNode;
  appearance?: Appearance;
}

const appearanceStyles: Record<
  Appearance,
  { bg?: string; color: string; border?: string }
> = {
  default: { bg: "#DFE1E6", color: "#172B4D" },
  success: { bg: "#E3FCEF", color: "#006644" },
  removed: { bg: "#FFEBE6", color: "#BF2600" },
  unit_stat: { bg: "#DDDEE1", color: "#292A2E" },
  new: { bg: "#EAE6FF", color: "#403294" },
  exp: {
    bg: "transparent",
    border: "1px solid #F87168",
    color: "#292A2E",
  },
  stat: {
    bg: "#8FB8F6",
    color: "#292A2E",
  },
};

const CustomLozenge: React.FC<Props> = ({
  children,
  appearance = "default",
}) => {
  const { bg, color, border } = appearanceStyles[appearance];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 3,
        backgroundColor: bg || "transparent",
        border: border || "none",
        color: color,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: "16px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
};

export default CustomLozenge;