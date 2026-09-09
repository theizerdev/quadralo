"use client";

import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarCloseTrigger,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/app-logo";
import { NavMain, NavItem } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  LayoutGrid,
  Wallet,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Blocks,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const baseNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Inversión",
    href: "/inversiones",
    icon: Wallet,
  },
  {
    title: "Ventas",
    href: "/ventas",
    icon: ShoppingCart,
  },
  {
    title: "Ganancias",
    href: "/ganancias",
    icon: TrendingUp,
  },
  {
    title: "Tasa BCV",
    href: "/bcv",
    icon: DollarSign,
    badge: "Editable",
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_superuser || user?.role === "superadmin";

  const navItems: NavItem[] = [...baseNavItems];

  // Menú de Integraciones exclusivo para el Usuario 1 (Empresa Principal / SuperAdmin)
  if (isSuperAdmin) {
    navItems.push({
      title: "Integraciones",
      href: "/integraciones",
      icon: Blocks,
      badge: "Empresa 1",
      items: [
        {
          title: "SMTP de Google",
          href: "/integraciones/smtp",
          icon: Mail,
          badge: "Email",
        },
      ],
    });
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between">
        <AppLogo name={user?.business_name || "Quádralo"} />
        <SidebarCloseTrigger />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
