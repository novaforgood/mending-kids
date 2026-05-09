import type { ReactNode } from "react";

/**
 * Light shell for inventory only (root layout uses gray main + padding).
 * Negative margin cancels `main` p-6 so the background fills edge-to-edge.
 */
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="inventory-page-light -m-6 min-h-[calc(100vh-4.5rem)] bg-[#ffffff] px-6 py-8 text-[#172B4D]">
      {children}
    </div>
  );
}