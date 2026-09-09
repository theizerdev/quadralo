"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut, User, Settings, Sparkles, Download, Crown, Phone, ShieldCheck } from "lucide-react";

export function NavUser() {
  const { user, logout } = useAuth();
  const { open, isMobile } = useSidebar();

  if (!user) return null;

  const isExpanded = open || isMobile;
  const isSuperAdmin = user.is_superuser || user.role === "superadmin";

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl p-2 text-left text-sm transition-all border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/90 shadow-2xs hover:bg-neutral-50 dark:hover:bg-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-300 cursor-pointer",
            !isExpanded && "justify-center p-1.5 border-transparent bg-transparent shadow-none hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
          )}
        >
          <div className="relative shrink-0">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className={isSuperAdmin ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs" : "rounded-lg text-xs font-semibold"}>
                {initials}
              </AvatarFallback>
            </Avatar>
            {isSuperAdmin && (
              <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px] shadow-xs">
                ★
              </span>
            )}
          </div>

          {isExpanded && (
            <>
              <div className="grid flex-1 text-left text-xs leading-tight min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-bold text-neutral-900 dark:text-white">
                    {user.full_name}
                  </span>
                  {isSuperAdmin && (
                    <Crown className="size-3 text-amber-500 shrink-0" />
                  )}
                </div>
                <span className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-neutral-400 shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-60"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
            <Avatar className="size-9">
              <AvatarFallback className={isSuperAdmin ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : ""}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <div className="flex items-center gap-1">
                <span className="truncate font-bold text-neutral-900 dark:text-white">{user.full_name}</span>
                {isSuperAdmin && <Crown className="size-3 text-amber-500" />}
              </div>
              <span className="truncate text-[11px] text-neutral-500">{user.email}</span>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                  <ShieldCheck className="size-3" />
                  Empresa Principal • SuperAdmin
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <div className="flex items-center gap-1.5 w-full">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate font-semibold text-xs">{user.business_name}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 pl-5">
                <Phone className="size-3 text-neutral-400" />
                <span>{user.phone}</span>
              </div>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("quadralo:install-pwa"));
              }
            }}
            className="text-emerald-600 dark:text-emerald-400 font-medium cursor-pointer"
          >
            <Download className="size-4" />
            <span>Instalar App PWA</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User className="size-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="size-4" />
            <span>Configuración</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
        >
          <LogOut className="size-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
