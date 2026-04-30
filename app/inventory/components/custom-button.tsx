import React from "react";
import Button from "@atlaskit/button";

const CustomButton = ({
  children,
  backgroundColor = "#422670",
  textColor = "#FFFFFF",
  hoverColor = "#5A3A8C",
  iconBefore,
  ...props
}) => {
  return (
    <Button
      {...props}
      iconBefore={iconBefore}
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