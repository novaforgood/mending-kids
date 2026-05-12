import type { ReactNode } from "react";
import Button from "@atlaskit/button";
import type { ButtonProps } from "@atlaskit/button";

type CustomButtonProps = ButtonProps & {
  backgroundColor?: string;
  textColor?: string;
  hoverColor?: string;
  width?: string | number;
  height?: string | number;
};

const CustomButton = ({
  children,
  backgroundColor = "#422670",
  textColor = "#FFFFFF",
  hoverColor = "#5A3A8C",
  width,
  height,
  iconBefore,
  ...props
}: CustomButtonProps) => {
  return (
    <Button
      {...props}
      iconBefore={iconBefore}
      style={{
        backgroundColor,
        color: textColor,
        border: "none",
        width,
        height,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
      }}
    >
      {children}
    </Button>
  );
};

export default CustomButton;