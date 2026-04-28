import React from "react";
import Button from "@atlaskit/button";

const CustomButton = ({
  children,
  backgroundColor = "#0052CC",
  textColor = "#FFFFFF",
  hoverColor = "#0065FF",
  ...props
}) => {
  return (
    <Button
      {...props}
      style={{
        backgroundColor,
        color: textColor,
        border: "none",
      }}
      onMouseEnter={(e) => {
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