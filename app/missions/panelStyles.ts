export const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
};

export const popupStyle = {
  backgroundColor: "white",
  color: "black",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  textAlign: "center" as const,
  minWidth: "300px",
};
