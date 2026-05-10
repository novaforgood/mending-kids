"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import AppSwitcherLegacyIcon from '@atlaskit/icon/core/app-switcher-legacy';
import DashboardIcon from '@atlaskit/icon/core/dashboard';
import AssetsIcon from '@atlaskit/icon/core/assets';
import ProjectIcon from '@atlaskit/icon/core/project';
import PersonAvatarIcon from '@atlaskit/icon/core/person-avatar';
import SettingsIcon from '@atlaskit/icon/core/settings';
import NotificationIcon from '@atlaskit/icon/core/notification';
import { supabaseBrowser as supabase } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  async function handleTestLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <>
      <header className="relative z-50 h-14 w-full bg-color-background border-b flex items-center justify-between px-4">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <AppSwitcherLegacyIcon label="Open menu" />
          </button>

          <div className="flex items-center gap-2">
            <div className="relative w-[81.067px] h-[32px] aspect-[38/15]">
              <Image
                src="/logo.png"
                alt="Mending Kids Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <span className="font-sans text-sm font-normal leading-5 text-gray-500">
              Inventory Management System
            </span>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/inventory-logs")}
            className="w-5 h-5 text-gray-700 cursor-pointer flex items-center justify-center hover:text-gray-900"
          >
            <NotificationIcon label="Notifications" />
          </button>

          <div className="w-5 h-5 text-gray-700 cursor-pointer flex items-center justify-center">
            <SettingsIcon label="Settings" />
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-400"
          >
            <PersonAvatarIcon label="Profile" />
          </button>

          <button
            type="button"
            onClick={() => void handleTestLogout()}
            className="font-sans text-xs font-medium text-gray-600 border border-gray-300 rounded-md px-2 py-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Log out (test)
          </button>

        </div>
      </header>

      {isSidebarOpen && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 flex">
          {/* Sidebar */}
          <div className="w-64 h-full bg-white border-r shadow-xl flex flex-col">
            <nav className="flex-1 overflow-y-auto py-2">
              <ul className="space-y-1 px-2 sidebar-nav-text font-sans text-sm font-normal leading-5 text-gray-500">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false)
                      router.push("/dashboard")
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <DashboardIcon label="Dashboard" />
                    <span>Dashboard</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false)
                      router.push("/missions")
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <ProjectIcon label="Missions" />
                    <span>Missions</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false)
                      router.push("/inventory")
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <AssetsIcon label="Inventory" />
                    <span>Inventory</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarOpen(false)
                      router.push("/audit-report")
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    <DashboardIcon label="Audit Report" />
                    <span>Audit Report</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Backdrop */}
          <button
            type="button"
            className="flex-1"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </>
  )
}
