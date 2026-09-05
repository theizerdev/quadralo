"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import {
  Wallet,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InvestmentSummary {
  total_invested_usd: number;
  total_invested_ves: number;
  total_items_count: number;
  total_shipping_usd: number;
  total_shipping_ves?: number;
  investments_count: number;
  current_bcv_rate: number;
}

interface SaleSummary {
  total_income_usd: number;
  total_income_ves: number;
  total_cost_usd: number;
  total_cost_ves: number;
  total_profit_usd: number;
  total_profit_ves: number;
  average_margin_percent: number;
  total_items_sold: number;
  sales_count: number;
  current_bcv_rate: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [invSummary, setInvSummary] = useState<InvestmentSummary | null>(null);
  const [saleSummary, setSaleSummary] = useState<SaleSummary | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<InvestmentSummary>("/investments/summary").catch(() => null),
      apiFetch<SaleSummary>("/sales/summary").catch(() => null),
    ]).then(([invData, saleData]) => {
      setInvSummary(invData);
      setSaleSummary(saleData);
    });
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Top 3 Cards Grid */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* Card 1: Inversión */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Invertido
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              <Wallet className="size-3.5" />
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              ${invSummary ? invSummary.total_invested_usd.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              ≈ {invSummary ? invSummary.total_invested_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 }) : "0.00"} VES
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span>{invSummary ? invSummary.investments_count : 0} compras ({invSummary ? invSummary.total_items_count : 0} uds)</span>
            <Link
              href="/inversiones"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ver</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Tasa BCV */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Tasa BCV de Referencia
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="size-3.5" />
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {invSummary ? invSummary.current_bcv_rate.toFixed(2) : "75.50"}{" "}
              <span className="text-xs font-normal text-neutral-500">VES/USD</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Modificable en cada compra y venta
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span>Banco Central de Vzla</span>
            <Link
              href="/bcv"
              className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ajustar</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Ventas & Ganancia Real */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Ganancia Neta en Ventas
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="size-3.5" />
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              +${saleSummary ? saleSummary.total_profit_usd.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Margen promedio: {saleSummary ? saleSummary.average_margin_percent.toFixed(1) : "0.0"}% ({saleSummary ? saleSummary.total_items_sold : 0} uds vendidas)
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <span>Facturado: ${saleSummary ? saleSummary.total_income_usd.toFixed(2) : "0.00"}</span>
            <Link
              href="/ventas"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ventas</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Bottom Section */}
      <div className="relative min-h-[500px] flex-1 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 overflow-hidden">
        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          {/* Business Intro Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60">
                <Sparkles className="size-3 text-blue-600 dark:text-blue-400" />
                <span>SaaS Activo: {user.business_name}</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Bienvenido, {user.full_name}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Tu sistema tiene activo el <strong>Módulo de Inversión</strong> y el <strong>Módulo de Ventas</strong> con cálculo de rentabilidad neta en USD/VES.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/inversiones">
                <Button variant="outline" className="gap-1.5 rounded-xl">
                  <Wallet className="size-4" />
                  <span>Inversiones</span>
                </Button>
              </Link>
              <Link href="/ventas">
                <Button className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl shadow-sm">
                  <Plus className="size-4" />
                  <span>Nueva Venta</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40">
              <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-white">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Módulo 1: Autenticación & Layout</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-6">
                Diseño idéntico a Laravel React Starter Kit con Radix UI, breadcrumbs, perfil de usuario y JWT en Python FastAPI.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Módulo 2: Inversión & Tasa BCV (Listo)</span>
                </div>
                <Link
                  href="/inversiones"
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                >
                  Abrir →
                </Link>
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1 pl-6">
                Ingreso de compras en Bolívares (VES), tasa BCV modificable, cantidad y costo de envío prorrateado.
              </p>
            </div>

            <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/30 p-4 dark:border-indigo-800/60 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-indigo-900 dark:text-indigo-200">
                  <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Módulo 3: Ventas & Margen de Ganancia (Listo)</span>
                </div>
                <Link
                  href="/ventas"
                  className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
                >
                  Abrir →
                </Link>
              </div>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1 pl-6">
                Registro de ventas conectado a inventario, cálculo de ganancia neta en USD/VES y métodos de pago.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40 opacity-80">
              <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-white">
                <div className="size-4 rounded-full border border-neutral-400 flex items-center justify-center text-[10px] text-neutral-500 font-bold">4</div>
                <span>Módulo 4: Reportes Avanzados & Flujo de Caja</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 pl-6">
                Gráficas estadísticas, exportación y comparativas de rendimiento por periodo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
