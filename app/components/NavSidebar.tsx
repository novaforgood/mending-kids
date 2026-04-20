"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Inventory",
    href: "/inventory",
    icon: "https://www.figma.com/api/mcp/asset/f7e998e7-d9c4-4224-bcf3-0668122bd62c",
  },
  {
    label: "Missions",
    href: "/dashboard",
    icon: "https://www.figma.com/api/mcp/asset/c254138c-8ddd-492a-acc8-b0a953adcdc5",
  },
  {
    label: "Inventory",
    href: "/inventory-status",
    icon: "https://www.figma.com/api/mcp/asset/f7e998e7-d9c4-4224-bcf3-0668122bd62c",
  },
];

export default function NavSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`shrink-0 bg-white border-r flex flex-col transition-all duration-200 overflow-hidden ${collapsed ? "w-0 border-r-0" : "w-[170px]"}`}
      style={{ borderColor: "rgba(11,18,40,0.14)" }}
    >
      <nav className="flex flex-col gap-1 pt-2 px-1">
        {NAV_ITEMS.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-[14px] transition-colors ${
                isActive
                  ? "bg-purple-50 text-[#9b46f0] font-semibold"
                  : "text-[#44546f] hover:bg-gray-100"
              }`}
            >
              <div className="w-[16px] h-[16px] relative shrink-0">
                <img
                  src={item.icon}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  style={isActive ? { filter: "invert(30%) sepia(90%) saturate(800%) hue-rotate(250deg)" } : {}}
                />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
