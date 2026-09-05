"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebarHeader } from "@/components/app-sidebar-header";
import { AppContent } from "@/components/app-content";
import { AppFooter } from "@/components/app-footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.is_verified === false && !user.is_superuser) {
        router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.is_verified === false && !user.is_superuser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs text-neutral-500 font-medium">Verificando acceso a Quádralo...</p>
        </div>
      </div>
    );
  }

  const breadcrumbs = [{ title: "Quádralo", href: "/dashboard" }];
  if (pathname?.startsWith("/inversiones")) {
    breadcrumbs.push({ title: "Inversión", href: "/inversiones" });
  } else if (pathname?.startsWith("/ventas")) {
    breadcrumbs.push({ title: "Ventas", href: "/ventas" });
  } else if (pathname?.startsWith("/ganancias")) {
    breadcrumbs.push({ title: "Ganancias", href: "/ganancias" });
  } else if (pathname?.startsWith("/bcv")) {
    breadcrumbs.push({ title: "Tasa BCV", href: "/bcv" });
  } else if (pathname?.startsWith("/integraciones")) {
    breadcrumbs.push({ title: "Integraciones", href: "/integraciones/smtp" });
    if (pathname.includes("/smtp")) {
      breadcrumbs.push({ title: "SMTP de Google", href: "/integraciones/smtp" });
    }
  } else {
    breadcrumbs.push({ title: "Dashboard", href: "/dashboard" });
  }

  return (
    <SidebarProvider>
      {/* 1. App Sidebar (Laravel Starter Kit Sidebar) */}
      <AppSidebar />

      {/* 2. Sidebar Inset with Header, Content and Footer */}
      <SidebarInset>
        {/* Navbar Header with Toggle, Breadcrumbs & Widgets */}
        <AppSidebarHeader breadcrumbs={breadcrumbs} />

        {/* Content Area */}
        <AppContent>{children}</AppContent>

        {/* Footer */}
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
