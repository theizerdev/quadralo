"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar, SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { cn } from "@/components/ui/card";
import { LucideIcon, ChevronDown } from "lucide-react";

export interface SubNavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | null;
  items?: SubNavItem[];
}

export function NavMain({
  items = [],
  label = "Plataforma",
}: {
  items: NavItem[];
  label?: string;
}) {
  const pathname = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const isExpanded = open || isMobile;

  // Estado para submenús desplegados
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Abrir automáticamente el submenú si la ruta actual coincide con alguno de sus hijos
    items.forEach((item) => {
      if (item.items && item.items.length > 0) {
        const isChildActive = item.items.some(
          (sub) => pathname === sub.href || pathname?.startsWith(sub.href)
        );
        if (isChildActive) {
          setOpenSubmenus((prev) => ({ ...prev, [item.title]: true }));
        }
      }
    });
  }, [pathname, items]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.items && item.items.length > 0);
          const isChildActive = hasChildren
            ? item.items!.some((sub) => pathname === sub.href || pathname?.startsWith(sub.href))
            : false;
          const isActive = pathname === item.href || isChildActive;
          const isSubmenuOpen = Boolean(openSubmenus[item.title]);

          if (hasChildren) {
            return (
              <div key={item.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isExpanded) {
                      toggleSubmenu(item.title);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all group relative cursor-pointer text-left",
                    isActive
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs"
                      : "text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                    !isExpanded && "justify-center px-2"
                  )}
                  title={!isExpanded ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive
                        ? "text-white dark:text-neutral-950"
                        : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"
                    )}
                  />

                  {isExpanded && (
                    <span className="truncate flex-1 font-medium">{item.title}</span>
                  )}

                  {isExpanded && item.badge && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium",
                        isActive
                          ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-950"
                          : "bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isExpanded && (
                    <ChevronDown
                      className={cn(
                        "size-3.5 text-neutral-400 transition-transform duration-200",
                        isSubmenuOpen && "rotate-180"
                      )}
                    />
                  )}
                </button>

                {/* Submenú desplegable */}
                {isExpanded && isSubmenuOpen && (
                  <div className="pl-6 pr-1 space-y-1 animate-in slide-in-from-top-2 duration-150">
                    {item.items!.map((sub) => {
                      const isSubActive = pathname === sub.href || pathname?.startsWith(sub.href);
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => isMobile && setOpenMobile(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                            isSubActive
                              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold border-l-2 border-emerald-500"
                              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/40"
                          )}
                        >
                          {SubIcon ? (
                            <SubIcon className="size-3.5 shrink-0" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-current opacity-70" />
                          )}
                          <span className="truncate flex-1">{sub.title}</span>
                          {sub.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {sub.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Ítem regular sin submenú
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setOpenMobile(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all group relative",
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-200/60 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100",
                !isExpanded && "justify-center px-2"
              )}
              title={!isExpanded ? item.title : undefined}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-transform group-hover:scale-105",
                  isActive
                    ? "text-white dark:text-neutral-950"
                    : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"
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
                      ? "bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-950"
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
