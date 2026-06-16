"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlertItems } from "../alerts/actions";
import { fetchAlertThresholdDays } from "../settings/alert-threshold/actions";
import { fetchActivityLog, fetchMissions } from "./actions";

type Row = {
  id: number;
  manufacturer: string;
  item_description: string | null;
  reference_number: string;
  quantity: number;
  unit: string | null;
  unit_of_measure: string | null;
  alert_threshold: number | null;
  expiration_date: string | null;
};

type Mission = {
  id: number;
  mission_name: string;
  start_date: string;
  end_date: string;
  location: string;
  category: string;
  status: string;
  created_at: string;
};

type ActivityLog = {
  id: number;
  created_at: string;
  description: string;
  timeAgo: string;
};

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [currentMissionPage, setCurrentMissionPage] = useState(1);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [alertThresholdDays, setAlertThresholdDays] = useState(180);

  function formatTimeAgo(createdAt: string, nowTime: number): string {
    const createdTime = new Date(createdAt).getTime();
    const diffMs = nowTime - createdTime;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;

    if (diffMs < minute) return "Just now";
    if (diffMs < hour) {
      const mins = Math.floor(diffMs / minute);
      return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    }
    if (diffMs < day) {
      const hours = Math.floor(diffMs / hour);
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    if (diffMs < 2 * day) return "Yesterday";
    if (diffMs < week) {
      const days = Math.floor(diffMs / day);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    const weeks = Math.floor(diffMs / week);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAlertItems();
        setRows(data);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, []);

  useEffect(() => {
    async function loadMissions() {
      try {
        const data = await fetchMissions();
        setMissions(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadMissions();
  }, []);

  useEffect(() => {
    async function loadActivityLogs() {
      try {
        const data = await fetchActivityLog();
        const nowTime = Date.now();
        const mapped: ActivityLog[] = data.map((entry: { id: number; created_at: string; description: string }) => ({
          ...entry,
          timeAgo: formatTimeAgo(entry.created_at, nowTime),
        }));
        setActivityLogs(mapped);
      } catch (err) {
        console.error(err);
      }
    }

    loadActivityLogs();
  }, []);

  useEffect(() => {
    async function loadThreshold() {
      try {
        const value = await fetchAlertThresholdDays();
        setAlertThresholdDays(value);
      } catch (err) {
        console.error(err);
      }
    }

    loadThreshold();
  }, []);

  const now = new Date();
  const expirationCutoff = new Date(now);
  expirationCutoff.setDate(expirationCutoff.getDate() + alertThresholdDays);

  const expirationItems = rows
    .filter((row) => {
      if (!row.expiration_date) return false;
      const expDate = new Date(row.expiration_date);
      return expDate <= expirationCutoff;
    })
    .sort((a, b) => {
      const dateA = new Date(a.expiration_date!);
      const dateB = new Date(b.expiration_date!);
      return dateA.getTime() - dateB.getTime();
    });

  function getInventoryStatus(row: Row): {
    label: string;
    badgeClass: string;
    priority: number;
  } {
    if (row.expiration_date && new Date(row.expiration_date) < now) {
      return { label: "EXPIRED", badgeClass: "bg-red-100 text-red-800", priority: 0 };
    }

    if (row.alert_threshold != null && row.quantity < row.alert_threshold) {
      return { label: "LOW STOCK", badgeClass: "bg-yellow-100 text-yellow-800", priority: 1 };
    }

    return { label: "IN STOCK", badgeClass: "bg-blue-100 text-blue-800", priority: 2 };
  }

  const itemStatusRows = [...rows]
    .sort((a, b) => {
      const statusDiff = getInventoryStatus(a).priority - getInventoryStatus(b).priority;
      if (statusDiff !== 0) return statusDiff;
      return (a.reference_number ?? "").localeCompare(b.reference_number ?? "");
    })
    .slice(0, 6);

  function getExpirationInfo(expirationDate: string): {
    text: string;
    priority: string;
    borderColor: string;
    textColor: string;
  } {
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (diffDays < 0) {
      return {
        priority: "HIGH PRIORITY",
        borderColor: "border-red-500",
        textColor: "text-red-600",
        text: "expired",
      };
    } else if (diffDays <= 60) {
      if (diffMonths > 0) {
        return {
          priority: "HIGH PRIORITY",
          borderColor: "border-red-500",
          textColor: "text-red-600",
          text: `expire in ${diffMonths} month${diffMonths > 1 ? "s" : ""}, ${remainingDays} days`,
        };
      }
      return {
        priority: "HIGH PRIORITY",
        borderColor: "border-red-500",
        textColor: "text-red-600",
        text: `expire in ${diffDays} days`,
      };
    } else {
      return {
        priority: "MEDIUM PRIORITY",
        borderColor: "border-yellow-500",
        textColor: "text-yellow-600",
        text: `expire in ${diffMonths} months, ${remainingDays} days`,
      };
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  function formatTimelineText(mission: Mission): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(mission.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(mission.end_date);
    endDate.setHours(0, 0, 0, 0);

    const status = mission.status.toLowerCase();
    if (status === "in_progress") {
      return "Now";
    }

    if (status === "completed") {
      const diffDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 7 && diffDays < 14) return "Last week";
      if (diffDays <= 0) return "Today";
      return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays < 7) return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    const weeks = Math.ceil(diffDays / 7);
    return `In ${weeks} week${weeks === 1 ? "" : "s"}`;
  }

  function missionBadgeClasses(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "completed") return "bg-pink-100 text-pink-800";
    if (normalizedStatus === "in_progress") return "bg-orange-100 text-orange-800";
    if (normalizedStatus === "planned") return "bg-green-100 text-green-800";
    return "bg-gray-200 text-gray-800";
  }

  function missionBadgeLabel(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "planned") return "PENDING";
    if (normalizedStatus === "in_progress") return "IN PROGRESS";
    if (normalizedStatus === "completed") return "COMPLETED";
    return "STATUS";
  }

  function missionActionCopy(status: string): { icon: string; text: string; className: string } {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "completed") {
      return { icon: "✓", text: "Mission completed", className: "text-gray-600" };
    }
    if (normalizedStatus === "in_progress") {
      return { icon: "▲", text: "Finalize mission completion", className: "text-orange-600" };
    }
    return { icon: "▲", text: "Actions required", className: "text-orange-600" };
  }

  // Only "current" missions — mirrors the Current tab on the missions page
  // (everything not archived) — ordered by most recently created first.
  const todayStr = new Date().toISOString().split("T")[0];
  const orderedMissions = [...missions]
    .filter((mission) => {
      const manuallyArchived = mission.status === "archived";
      const restored = mission.status === "active";
      const pastEndDate = !!mission.end_date && mission.end_date < todayStr;
      const goesToArchive = manuallyArchived || (!restored && pastEndDate);
      return !goesToArchive;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const missionsPerPage = 4;
  const totalMissionPages = Math.max(1, Math.ceil(orderedMissions.length / missionsPerPage));
  const clampedMissionPage = Math.min(currentMissionPage, totalMissionPages);
  const missionStartIndex = (clampedMissionPage - 1) * missionsPerPage;
  const visibleMissions = orderedMissions.slice(missionStartIndex, missionStartIndex + missionsPerPage);

  function getMissionPaginationItems(): Array<number | "ellipsis"> {
    if (totalMissionPages <= 7) {
      return Array.from({ length: totalMissionPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];
    const start = Math.max(2, clampedMissionPage - 1);
    const end = Math.min(totalMissionPages - 1, clampedMissionPage + 1);

    if (start > 2) items.push("ellipsis");
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < totalMissionPages - 1) items.push("ellipsis");
    items.push(totalMissionPages);

    return items;
  }

  const missionPaginationItems = getMissionPaginationItems();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar grid for current month
  function generateCalendarDays(date: Date): Array<{ day: number; isCurrentMonth: boolean; date: Date }> {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarCells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      calendarCells.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month - 1, day),
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      calendarCells.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Add next month's days to fill the grid
    const remainingCells = 42 - calendarCells.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      calendarCells.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day),
      });
    }

    return calendarCells;
  }

  const calendarCells = generateCalendarDays(currentCalendarDate);
  const calendarWeeks: Array<Array<{ day: number; isCurrentMonth: boolean; date: Date }>> = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    calendarWeeks.push(calendarCells.slice(i, i + 7));
  }

  // Map missions to calendar dates
  function getMissionsForDate(date: Date): Mission[] {
    const dateStr = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    return missions.filter((mission) => {
      const startDate = mission.start_date;
      const endDate = mission.end_date;
      return dateStr >= startDate && dateStr <= endDate;
    });
  }

  function getStatusColor(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "completed") return "bg-pink-400";
    if (normalizedStatus === "in_progress") return "bg-orange-400";
    if (normalizedStatus === "planned") return "bg-green-400";
    return "bg-gray-400";
  }

  function getStatusColorLight(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "completed") return "bg-pink-200";
    if (normalizedStatus === "in_progress") return "bg-orange-200";
    if (normalizedStatus === "planned") return "bg-green-200";
    return "bg-gray-200";
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function formatCalendarMonthYear(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function goToPreviousMonth() {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  }

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Top Section - Missions and Expiration Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Missions Section */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Missions</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-1">
              {visibleMissions.map((mission) => {
                const action = missionActionCopy(mission.status);
                const timelineColor = mission.status.toLowerCase() === "planned" ? "text-red-600" : "text-gray-600";
                const categoryColorClass = getStatusColorLight(mission.status);

                return (
                  <Link 
                    href={`/missions/${mission.id}`} 
                    key={mission.id} 
                    className="border border-gray-200 rounded p-4 block hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{mission.mission_name}</span>
                      <span className={`${missionBadgeClasses(mission.status)} text-xs px-2 py-1 rounded`}>
                        {missionBadgeLabel(mission.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${categoryColorClass} text-black text-xs px-2 py-1 rounded font-medium`}>
                        {mission.category}
                      </span>
                    </div>
                    <div className={`flex items-center text-sm ${timelineColor} mb-1`}>
                      <span className="mr-1">⊗</span>
                      <span>{formatTimelineText(mission)}</span>
                    </div>
                    <div className={`flex items-center text-sm ${action.className}`}>
                      <span className="mr-1">{action.icon}</span>
                      <span>{action.text}</span>
                    </div>
                  </Link>
                );
              })}

              {visibleMissions.length === 0 && (
                <div className="border border-gray-200 rounded p-4 md:col-span-2 text-center text-gray-500">
                  No missions
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setCurrentMissionPage((prev) => Math.max(1, prev - 1))}
                disabled={clampedMissionPage === 1}
                className={clampedMissionPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-600"}
              >
                ‹
              </button>

              {missionPaginationItems.map((item, index) => {
                if (item === "ellipsis") {
                  return (
                    <span key={`ellipsis-${index}`} className="text-gray-600">
                      ...
                    </span>
                  );
                }

                const isActive = item === clampedMissionPage;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCurrentMissionPage(item)}
                    className={
                      isActive
                        ? "bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center"
                        : "text-gray-600 hover:bg-gray-100 w-6 h-6 rounded flex items-center justify-center"
                    }
                  >
                    {item}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentMissionPage((prev) => Math.min(totalMissionPages, prev + 1))}
                disabled={clampedMissionPage === totalMissionPages}
                className={
                  clampedMissionPage === totalMissionPages ? "text-gray-400 cursor-not-allowed" : "text-gray-600"
                }
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Expiration Alerts Section */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Expiration Alerts</h2>

            <div className="space-y-3 overflow-y-auto flex-1">
              {expirationItems.map((item) => {
                const { text, priority, borderColor, textColor } = getExpirationInfo(item.expiration_date!);
                return (
                  <div key={`exp-${item.id}`} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`border ${borderColor} ${textColor} text-xs font-bold px-2 py-1 rounded whitespace-nowrap`}
                        >
                          {priority}
                        </span>
                        <span className="text-gray-700 text-sm">
                          {item.quantity} {item.unit} {item.reference_number} {text} (
                          {formatDate(item.expiration_date!)})
                        </span>
                      </div>
                      <Link href="/inventory" className="text-gray-400 text-lg hover:text-gray-600">
                        →
                      </Link>
                    </div>
                  </div>
                );
              })}

              {expirationItems.length === 0 && (
                <div className="text-gray-500 text-center py-4">No expiration alerts</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Calendar, Recent Activity, Item Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1">
                <button
                  onClick={goToPreviousMonth}
                  className="text-gray-600 hover:text-gray-800 px-1 hover:cursor-pointer"
                  title="Previous month"
                >
                  ‹
                </button>
              </div>
              <h2 className="font-semibold">{formatCalendarMonthYear(currentCalendarDate)}</h2>
              <div className="flex gap-1">
                <button
                  onClick={goToNextMonth}
                  className="text-gray-600 hover:text-gray-800 px-1 hover:cursor-pointer"
                  title="Next month"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-gray-600 font-medium p-2">
                  {day}
                </div>
              ))}

              {calendarWeeks.map((week, weekIndex) =>
                week.map((cell, dayIndex) => {
                  const dayMissions = getMissionsForDate(cell.date);
                  const today = isToday(cell.date);
                  const maxBars = 3;
                  const visibleMissions = dayMissions.slice(0, maxBars);
                  const hasMore = dayMissions.length > maxBars;

                  const dateKey = cell.date.toISOString().split("T")[0];
                  const isHovered = hoveredDate === dateKey;

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`p-1 min-h-[48px] flex flex-col items-center justify-start relative ${
                        !cell.isCurrentMonth
                          ? "text-gray-300"
                          : today
                          ? "bg-blue-500 text-white rounded font-semibold"
                          : "rounded"
                      }`}
                      onMouseEnter={() => dayMissions.length > 0 && setHoveredDate(dateKey)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      <div className="text-sm mb-1">{cell.day}</div>
                      {cell.isCurrentMonth && dayMissions.length > 0 && (
                        <div className="flex flex-col gap-0.5 w-full px-1">
                          {visibleMissions.map((mission) => (
                            <div
                              key={`${cell.date.toISOString()}-${mission.id}`}
                              className={`h-1 rounded-full ${getStatusColor(mission.status)}`}
                            />
                          ))}
                          {hasMore && (
                            <div className="text-[8px] text-gray-500 mt-0.5">+{dayMissions.length - maxBars}</div>
                          )}
                        </div>
                      )}
                      {isHovered && dayMissions.length > 0 && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                          <div className="font-semibold mb-1">
                            {dayMissions.length} mission{dayMissions.length > 1 ? "s" : ""}
                          </div>
                          {dayMissions.map((mission) => (
                            <Link key={mission.id} href={`/missions/${mission.id}`} className="block text-gray-200 hover:text-white hover:underline">
                              • {mission.mission_name}
                            </Link>
                          ))}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

            <div className="space-y-3 mb-4">
              {activityLogs.map((entry) => (
                <div key={entry.id} className="flex justify-between text-sm">
                  <span className="text-black">{entry.description}</span>
                  <span className="text-gray-500">{entry.timeAgo}</span>
                </div>
              ))}

              {activityLogs.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">No recent activity</div>
              )}
            </div>

            <Link
              href="/inventory-logs"
              className="inline-block text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Item Status Updates */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Item Status Updates</h2>

            <div className="space-y-3 mb-4">
              {itemStatusRows.map((item) => {
                const status = getInventoryStatus(item);
                return (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-black">{item.item_description || item.reference_number || "Unknown item"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`${status.badgeClass} text-xs px-2 py-1 rounded`}>{status.label}</span>
                      <span className="text-gray-600">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>
                );
              })}

              {itemStatusRows.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">No item status updates</div>
              )}
            </div>

            <Link
              href="/inventory-status"
              className="inline-block text-sm text-gray-600 border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
