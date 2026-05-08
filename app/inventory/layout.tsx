import type { ReactNode } from "react";

/**
 * Dark shell for inventory only (root layout uses gray main + padding).
 * Negative margin cancels `main` p-6 so the background fills edge-to-edge.
 */
export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="inventory-page-dark -m-6 min-h-[calc(100vh-4.5rem)] bg-[#0d0d0d] px-6 py-8 text-[#E6EDF3]">
      {children}
    </div>
  );
}
