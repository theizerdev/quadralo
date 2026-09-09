"use client";

import React, { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs, BreadcrumbItem } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { DollarSign, ShieldCheck, Coins } from "lucide-react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface RateItem {
  rate: number;
  official_rate?: number;
  is_custom?: boolean;
}

interface RatesData {
  usd_bcv?: RateItem;
  eur_bcv?: RateItem;
  usdt_p2p?: { rate: number };
}

export function AppSidebarHeader({
  breadcrumbs = [],
}: {
  breadcrumbs?: BreadcrumbItem[];
}) {
  const [rates, setRates] = useState<RatesData | null>(null);

  useEffect(() => {
    apiFetch<RatesData>("/bcv/latest")
      .then((data) => setRates(data))
      .catch((e) => console.error("Error al cargar tasas:", e));
  }, []);

  const usdRate = rates?.usd_bcv?.rate;
  const isCustom = rates?.usd_bcv?.is_custom;
  const usdtRate = rates?.usdt_p2p?.rate;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200/70 dark:border-neutral-800/70 px-3 sm:px-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-1 h-4 hidden sm:block" />
      
      <div className="flex items-center min-w-0 flex-1 sm:flex-initial overflow-hidden">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>

      {/* Right side widgets */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* BCV Dollar Chip */}
        <Link
          href="/bcv"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shrink-0"
          title="Ver o modificar tasas oficiales y USDT"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">BCV:</span>
          <span className="font-bold">
            Bs. {usdRate ? usdRate.toFixed(2) : "..."}
          </span>
          {isCustom && (
            <span className="text-[10px] bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100 px-1 rounded font-semibold hidden sm:inline">
              Manual
            </span>
          )}
        </Link>

        {/* USDT P2P Chip */}
        {usdtRate && (
          <Link
            href="/bcv"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/70 text-neutral-700 dark:text-neutral-300 text-xs font-medium hover:bg-neutral-200/60 transition-colors"
            title="Referencia de Compra USDT Binance P2P"
          >
            <Coins className="size-3 text-emerald-600" />
            <span>USDT:</span>
            <span className="font-bold">Bs. {usdtRate.toFixed(2)}</span>
          </Link>
        )}

        <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 px-2 py-1">
          <ShieldCheck className="size-3.5 text-neutral-400" />
          <span>SaaS</span>
        </div>
      </div>
    </header>
  );
}
