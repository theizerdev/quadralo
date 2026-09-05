"use client";

import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const mainNavItems: NavItem[] = [
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

  return (
    <Sidebar>
      <SidebarHeader>
        <AppLogo name={user?.business_name || "ADATOV"} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
