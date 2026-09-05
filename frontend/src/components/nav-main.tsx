"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { cn } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const isExpanded = open || isMobile;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setOpenMobile(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all group relative",
                isActive
                  ? "bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-medium shadow-2xs"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200",
                !isExpanded && "justify-center px-2"
              )}
              title={!isExpanded ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  isActive
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 dark:text-neutral-400"
                )}
              />

              {isExpanded && (
                <span className="truncate flex-1">{item.title}</span>
              )}

              {isExpanded && item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </SidebarGroup>
  );
}
