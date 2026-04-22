interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  step?: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SidePanel({ isOpen, onClose, step = 1, title, subtitle, children, footer }: SidePanelProps) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 400,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.35s ease-in-out",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          backgroundColor: "white",
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.35s ease-in-out",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            height: 3,
            backgroundColor: "#5243AA",
            width: step === 1 ? "50%" : "100%",
            transition: "width 0.3s ease",
          }}
        />

        {/* Header */}
        <div style={{ padding: "20px 24px 0" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "#6B778C",
              fontSize: 20,
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            ×
          </button>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#172B4D" }}>
            {title}
          </h2>
          {subtitle && <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6B778C" }}>{subtitle}</p>}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 16px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #DFE1E6",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}