import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardShell from "./DashboardShell";

export const metadata: Metadata = {
  title: "Missions | Mending Kids",
  description: "Inventory Management System",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
