"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import NavSidebar from "@/app/components/NavSidebar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Navigation — 56px */}
      <header
        className="shrink-0 h-[56px] flex items-center justify-between px-3 bg-white border-b"
        style={{ borderColor: "rgba(11,18,40,0.14)" }}
      >
        {/* Left: app switcher + logo + title */}
        <div className="flex items-center gap-3 h-full">
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <img
              src="https://www.figma.com/api/mcp/asset/f7e998e7-d9c4-4224-bcf3-0668122bd62c"
              alt="App switcher"
              width={24}
              height={24}
            />
          </button>
          <div className="relative shrink-0" style={{ width: "81px", height: "32px" }}>
            <img
              src="https://www.figma.com/api/mcp/asset/0ef4520b-e3ab-4d64-a8f7-2d798dd3abe1"
              alt="Mending Kids"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </div>
          <span className="text-[14px] text-[#6c6f77] whitespace-nowrap">
            Inventory Management System
          </span>
        </div>

        {/* Right: search + bell + settings + avatar */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative w-[240px] h-[32px]">
            <div className="absolute left-2 top-[6px] w-[20px] h-[20px] pointer-events-none">
              <img
                src="https://www.figma.com/api/mcp/asset/22a6d49b-75d3-4b49-81ca-7cf27b8421f9"
                alt=""
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full h-full pl-[36px] pr-3 border-2 border-[#8c8f97] rounded-[5px] text-[14px] text-[#6c6f77] bg-white focus:outline-none"
            />
          </div>

          {/* Notification bell */}
          <div className="relative p-1">
            <div className="w-[24px] h-[24px] relative">
              <img
                src="https://www.figma.com/api/mcp/asset/a7ee12b7-d530-4e55-9916-957356c2120d"
                alt="Notifications"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>

          {/* Settings */}
          <button className="p-1 rounded hover:bg-gray-100">
            <div className="w-[24px] h-[24px] relative">
              <img
                src="https://www.figma.com/api/mcp/asset/eee77c2b-e359-44f5-8fca-1d71bb9ccaba"
                alt="Settings"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </button>

          {/* User avatar */}
          <button className="p-1 rounded-full">
            <div className="w-[32px] h-[32px] relative rounded-full overflow-hidden bg-gray-200">
              <img
                src="https://www.figma.com/api/mcp/asset/88b54208-6287-46f1-893a-2f434460a31a"
                alt="User"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </header>

      {/* Sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        <NavSidebar collapsed={!sidebarOpen} />
        <main className="flex-1 overflow-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
