"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import {
  Wallet,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Plus,
  Calendar,
  RefreshCw,
  Percent,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  CheckCircle2,
  Coins,
  ArrowUpRight,
  Award,
  Receipt,
  Scale,
  Activity,
  Package,
  TrendingDown,
  ArrowDownRight,
  AlertTriangle,
  Users,
} from "lucide-react";
import { ApexOptions } from "apexcharts";

// Dynamic import of ReactApexChart to prevent SSR hydration warnings in Next.js
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="flex flex-col items-center gap-2">
        <div className="size-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
        <span className="text-xs text-neutral-400">Cargando gráfico interactivo...</span>
      </div>
    </div>
  ),
});

// Tipos para API de Inversiones y Ventas
interface InvestmentSummary {
  total_invested_usd: number;
  total_invested_ves: number;
  total_items_count: number;
  total_shipping_usd: number;
  total_shipping_ves?: number;
  investments_count: number;
  current_bcv_rate: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
}

interface CustomerKPIs {
  total_customers: number;
  debtors_count: number;
  up_to_date_count: number;
  total_receivable_usd: number;
  total_receivable_ves: number;
  average_ticket_usd: number;
}

interface TimelinePoint {
  date: string;
  label: string;
  revenue_usd: number;
  revenue_ves: number;
  cost_usd: number;
  cost_ves: number;
  profit_usd: number;
  profit_ves: number;
  margin_percent: number;
  items_sold: number;
  transactions_count: number;
}

interface PaymentMethodMetric {
  method: string;
  revenue_usd: number;
  revenue_ves: number;
  profit_usd: number;
  profit_ves: number;
  sales_count: number;
  share_percent: number;
}

interface ProductProfitMetric {
  product_name: string;
  units_sold: number;
  revenue_usd: number;
  revenue_ves: number;
  cost_usd: number;
  cost_ves: number;
  profit_usd: number;
  profit_ves: number;
  margin_percent: number;
  profit_share_percent: number;
}

interface ProfitTiers {
  high_margin_count: number;
  medium_margin_count: number;
  low_margin_count: number;
}

interface SalesAnalyticsSummary {
  total_revenue_usd: number;
  total_revenue_ves: number;
  total_cogs_usd: number;
  total_cogs_ves: number;
  net_profit_usd: number;
  net_profit_ves: number;
  gross_margin_percent: number;
  markup_margin_percent: number;
  roi_percent: number;
  total_items_sold: number;
  sales_count: number;
  average_ticket_usd: number;
  average_ticket_ves: number;
  current_bcv_rate: number;
}

interface SalesAnalyticsResponse {
  summary: SalesAnalyticsSummary;
  timeline: TimelinePoint[];
  by_payment_method: PaymentMethodMetric[];
  top_products: ProductProfitMetric[];
  profit_tiers: ProfitTiers;
  filter_preset?: string;
  start_date?: string;
  end_date?: string;
}

type CurrencyType = "USD" | "VES";
type FilterPreset = "today" | "7d" | "30d" | "this_month" | "last_month" | "this_year" | "all" | "custom";
type Granularity = "day" | "week" | "month";

export default function DashboardPage() {
  const { user } = useAuth();

  // Estados de control
  const [currency, setCurrency] = useState<CurrencyType>("USD");
  const [preset, setPreset] = useState<FilterPreset>("this_month");
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customRangeActive, setCustomRangeActive] = useState(false);
  const [chartMode, setChartMode] = useState<"grouped" | "stacked" | "line">("grouped");

  // Estados de datos
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(null);
  const [invSummary, setInvSummary] = useState<InvestmentSummary | null>(null);
  const [customerKpis, setCustomerKpis] = useState<CustomerKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tasa BCV activa
  const bcvRate = analytics?.summary.current_bcv_rate || invSummary?.current_bcv_rate || 75.5;

  // Carga de datos
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (preset === "custom" && (startDate || endDate)) {
        params.set("preset", "custom");
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);
      } else {
        params.set("preset", preset);
      }
      params.set("group_by", granularity);

      const [analyticsData, investmentData, customersData] = await Promise.all([
        apiFetch<SalesAnalyticsResponse>(`/sales/analytics?${params.toString()}`).catch(() => null),
        apiFetch<InvestmentSummary>(`/investments/summary?${params.toString()}`).catch(() => null),
        apiFetch<{ kpis: CustomerKPIs }>("/customers/").catch(() => null),
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      if (investmentData) setInvSummary(investmentData);
      if (customersData?.kpis) setCustomerKpis(customersData.kpis);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [preset, granularity, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Formateadores
  const formatMoney = (amountUsd: number, amountVes?: number) => {
    if (currency === "USD") {
      return `$${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const valVes = amountVes !== undefined ? amountVes : amountUsd * bcvRate;
    return `Bs. ${valVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSecondaryMoney = (amountUsd: number, amountVes?: number) => {
    if (currency === "USD") {
      const valVes = amountVes !== undefined ? amountVes : amountUsd * bcvRate;
      return `≈ Bs. ${valVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `≈ $${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Resumen Financiero Rápido
  const summary = analytics?.summary;
  const totalRevenue = currency === "USD" ? summary?.total_revenue_usd || 0 : summary?.total_revenue_ves || 0;
  const totalCogs = currency === "USD" ? summary?.total_cogs_usd || 0 : summary?.total_cogs_ves || 0;
  const totalProfit = currency === "USD" ? summary?.net_profit_usd || 0 : summary?.net_profit_ves || 0;
  const grossMargin = summary?.gross_margin_percent || 0;
  const markupMargin = summary?.markup_margin_percent || 0;

  const totalInvested = currency === "USD" ? invSummary?.total_invested_usd || 0 : invSummary?.total_invested_ves || 0;

  // Clasificación del margen
  const getMarginBadge = (margin: number) => {
    if (margin >= 45) {
      return { label: "Margen Excelente", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    }
    if (margin >= 20) {
      return { label: "Margen Saludable", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    }
    return { label: "Margen Reducido", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
  };

  // 1. Gráfico Principal: Evolución de Ventas, Costos y Ganancia Neta
  const timelineSeries = useMemo(() => {
    if (!analytics?.timeline || analytics.timeline.length === 0) return [];

    if (chartMode === "stacked") {
      // Modo Composición: Costo + Ganancia apilados suman el 100% de la venta
      return [
        {
          name: "Costo Mercancía (COGS)",
          data: analytics.timeline.map((p) =>
            Number((currency === "USD" ? p.cost_usd : p.cost_ves).toFixed(2))
          ),
        },
        {
          name: "Ganancia Neta",
          data: analytics.timeline.map((p) =>
            Number((currency === "USD" ? p.profit_usd : p.profit_ves).toFixed(2))
          ),
        },
      ];
    }

    if (chartMode === "line") {
      // Modo Líneas de Tendencia
      return [
        {
          name: "Ventas Totales",
          data: analytics.timeline.map((p) =>
            Number((currency === "USD" ? p.revenue_usd : p.revenue_ves).toFixed(2))
          ),
        },
        {
          name: "Costo Mercancía (COGS)",
          data: analytics.timeline.map((p) =>
            Number((currency === "USD" ? p.cost_usd : p.cost_ves).toFixed(2))
          ),
        },
        {
          name: "Ganancia Neta",
          data: analytics.timeline.map((p) =>
            Number((currency === "USD" ? p.profit_usd : p.profit_ves).toFixed(2))
          ),
        },
      ];
    }

    // Modo por Defecto: "grouped" (Barras Comparativas Lado a Lado)
    return [
      {
        name: "Ventas Totales",
        data: analytics.timeline.map((p) =>
          Number((currency === "USD" ? p.revenue_usd : p.revenue_ves).toFixed(2))
        ),
      },
      {
        name: "Costo Mercancía (COGS)",
        data: analytics.timeline.map((p) =>
          Number((currency === "USD" ? p.cost_usd : p.cost_ves).toFixed(2))
        ),
      },
      {
        name: "Ganancia Neta",
        data: analytics.timeline.map((p) =>
          Number((currency === "USD" ? p.profit_usd : p.profit_ves).toFixed(2))
        ),
      },
    ];
  }, [analytics, currency, chartMode]);

  const timelineOptions: ApexOptions = useMemo(() => {
    const categories = analytics?.timeline.map((p) => p.label) || [];
    const isStacked = chartMode === "stacked";
    const isLine = chartMode === "line";

    const colors = isStacked
      ? ["#94A3B8", "#10B981"] // Costo (Slate), Ganancia (Emerald)
      : ["#6366F1", "#94A3B8", "#10B981"]; // Ventas (Indigo), Costo (Slate), Ganancia (Emerald)

    return {
      chart: {
        type: isLine ? "line" : "bar",
        stacked: isStacked,
        height: 330,
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 400 },
        fontFamily: "inherit",
      },
      colors,
      stroke: {
        show: true,
        width: isLine ? 3 : isStacked ? 1 : 2,
        curve: "smooth",
        colors: isLine ? undefined : ["transparent"],
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: categories.length === 1 ? "28%" : categories.length <= 4 ? "42%" : "58%",
          borderRadius: 4,
          borderRadiusApplication: "end",
        },
      },
      dataLabels: {
        enabled: false,
      },
      markers: {
        size: isLine ? 5 : 0,
        hover: { size: 7 },
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: "#94A3B8", fontSize: "11px", fontWeight: 500 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#94A3B8", fontSize: "11px" },
          formatter: (val) =>
            currency === "USD" ? `$${val.toLocaleString()}` : `Bs. ${val.toLocaleString()}`,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        theme: "dark",
        y: {
          formatter: (val) =>
            currency === "USD"
              ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `Bs. ${val.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
        fontWeight: 600,
        markers: { size: 6 },
        itemMargin: { horizontal: 8, vertical: 2 },
      },
      grid: {
        borderColor: "rgba(148, 163, 184, 0.15)",
        strokeDashArray: 4,
      },
    };
  }, [analytics, currency, chartMode]);

  // 2. Gráfico de Curva de Margen (%)
  const marginSeries = useMemo(() => {
    if (!analytics?.timeline) return [];
    return [
      {
        name: "Margen Real %",
        data: analytics.timeline.map((p) => p.margin_percent),
      },
    ];
  }, [analytics]);

  const marginOptions: ApexOptions = useMemo(() => {
    const categories = analytics?.timeline.map((p) => p.label) || [];
    return {
      chart: {
        type: "area",
        height: 240,
        toolbar: { show: false },
        fontFamily: "inherit",
      },
      colors: ["#10B981"],
      stroke: { curve: "smooth", width: 2.5 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 95],
        },
      },
      annotations: {
        yaxis: [
          {
            y: 30,
            borderColor: "#F59E0B",
            strokeDashArray: 4,
            label: {
              borderColor: "#F59E0B",
              style: { color: "#fff", background: "#F59E0B", fontSize: "10px" },
              text: "Meta 30%",
            },
          },
        ],
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: "#94A3B8", fontSize: "10px" },
        },
        axisBorder: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#94A3B8", fontSize: "10px" },
          formatter: (val) => `${val.toFixed(0)}%`,
        },
      },
      tooltip: {
        theme: "dark",
        y: { formatter: (val) => `${val.toFixed(2)}%` },
      },
      grid: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        strokeDashArray: 3,
      },
    };
  }, [analytics]);

  // 3. Gráfico de Métodos de Pago (Donut)
  const paymentSeries = useMemo(() => {
    if (!analytics?.by_payment_method) return [];
    return analytics.by_payment_method.map((p) =>
      currency === "USD" ? p.revenue_usd : p.revenue_ves
    );
  }, [analytics, currency]);

  const paymentOptions: ApexOptions = useMemo(() => {
    const labels = analytics?.by_payment_method.map((p) => p.method) || [];
    return {
      chart: { type: "donut", height: 280, fontFamily: "inherit" },
      labels,
      colors: ["#10B981", "#6366F1", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899"],
      dataLabels: { enabled: false },
      legend: {
        position: "bottom",
        fontSize: "11px",
        markers: { size: 5 },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val) =>
            currency === "USD"
              ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `Bs. ${val.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Ventas",
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748B",
                formatter: () =>
                  currency === "USD"
                    ? `$${(analytics?.summary.total_revenue_usd || 0).toLocaleString()}`
                    : `Bs. ${(analytics?.summary.total_revenue_ves || 0).toLocaleString()}`,
              },
            },
          },
        },
      },
    };
  }, [analytics, currency]);

  // 4. Gráfico Top Productos Más Rentables
  const topProductsSeries = useMemo(() => {
    if (!analytics?.top_products) return [];
    const slice = analytics.top_products.slice(0, 6);
    return [
      {
        name: "Ganancia Neta",
        data: slice.map((p) =>
          Number((currency === "USD" ? p.profit_usd : p.profit_ves).toFixed(2))
        ),
      },
    ];
  }, [analytics, currency]);

  const topProductsOptions: ApexOptions = useMemo(() => {
    const slice = analytics?.top_products.slice(0, 6) || [];
    const categories = slice.map((p) => p.product_name);
    return {
      chart: { type: "bar", height: 260, toolbar: { show: false }, fontFamily: "inherit" },
      colors: ["#10B981"],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: "55%",
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        labels: {
          style: { colors: "#94A3B8", fontSize: "10px" },
          formatter: (val) =>
            currency === "USD" ? `$${Number(val).toFixed(0)}` : `Bs. ${Number(val).toFixed(0)}`,
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#94A3B8", fontSize: "11px", fontWeight: 500 },
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val) =>
            currency === "USD"
              ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `Bs. ${val.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`,
        },
      },
      grid: {
        borderColor: "rgba(148, 163, 184, 0.12)",
        strokeDashArray: 3,
      },
    };
  }, [analytics, currency]);

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col gap-5 pb-10">
      {/* 1. Header Principal y Controles de Moneda / BCV */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900/70 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="size-3" />
            <span>Quádralo · {user.business_name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Resumen Financiero Ejecutivo
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Control en tiempo real de inversiones, facturación de ventas y márgenes de ganancia neta.
          </p>
        </div>

        {/* Acciones de Moneda, Tasa BCV y Refrescar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Tasa BCV Oficial */}
          <Link
            href="/bcv"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:border-emerald-500 transition-colors text-xs font-medium group shrink-0"
            title="Tasa oficial BCV. Haz clic para consultar o ajustar."
          >
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>BCV: <strong>{bcvRate.toFixed(2)}</strong> VES</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 group-hover:underline">Ajustar →</span>
          </Link>

          {/* Toggle de Moneda Dual */}
          <div className="flex items-center rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
            <button
              onClick={() => setCurrency("USD")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <DollarSign className="size-3.5" />
              <span>USD ($)</span>
            </button>
            <button
              onClick={() => setCurrency("VES")}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currency === "VES"
                  ? "bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Coins className="size-3.5" />
              <span>VES (Bs.)</span>
            </button>
          </div>

          {/* Botón Refrescar */}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={refreshing}
            className="rounded-xl size-8 shrink-0"
            title="Actualizar datos en tiempo real"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Acciones directas */}
          <Link href="/ventas" className="shrink-0">
            <Button className="gap-1.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs h-8 px-3">
              <Plus className="size-3.5" />
              <span>Nueva Venta</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Barra de Filtro por Rango de Fechas en Tiempo Real */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900/60 p-3 sm:p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar className="size-4 text-neutral-400 shrink-0" />
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Período:
            </span>
          </div>
          {/* Pills de presets con swipe horizontal suave en móvil */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 xs:pb-0 scrollbar-none flex-nowrap sm:flex-wrap">
            {[
              { id: "today", label: "Hoy" },
              { id: "7d", label: "7 Días" },
              { id: "30d", label: "30 Días" },
              { id: "this_month", label: "Este Mes" },
              { id: "last_month", label: "Mes Anterior" },
              { id: "this_year", label: "Este Año" },
              { id: "all", label: "Todo" },
              { id: "custom", label: "Personalizado" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setPreset(tab.id as FilterPreset);
                  if (tab.id === "custom") {
                    setCustomRangeActive(true);
                  } else {
                    setCustomRangeActive(false);
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                  preset === tab.id
                    ? "bg-neutral-900 text-white dark:bg-emerald-600 dark:text-white shadow-2xs font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Granularidad (Día, Semana, Mes) */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-neutral-400 mr-1 text-[11px]">Agrupar:</span>
          {(["day", "week", "month"] as Granularity[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                granularity === g
                  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
              }`}
            >
              {g === "day" ? "Día" : g === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* Rango Personalizado Expandible */}
      {customRangeActive && (
        <div className="flex flex-wrap items-center gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Desde:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">Hasta:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={fetchData}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
          >
            Aplicar Rango
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setPreset("this_month");
              setCustomRangeActive(false);
            }}
            className="h-8 text-xs text-neutral-500"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* 2.5 Alertas Operativas: Stock Mínimo y Cuentas por Cobrar */}
      {(((invSummary?.low_stock_count ?? 0) > 0 || (invSummary?.out_of_stock_count ?? 0) > 0) || ((customerKpis?.debtors_count ?? 0) > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alerta de Stock Mínimo */}
          {((invSummary?.low_stock_count ?? 0) > 0 || (invSummary?.out_of_stock_count ?? 0) > 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    Alerta de Inventario: Reabastecimiento
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                    <strong>{invSummary?.out_of_stock_count ?? 0} agotados</strong> y{" "}
                    <strong>{invSummary?.low_stock_count ?? 0} con stock bajo</strong>.
                  </p>
                </div>
              </div>
              <Link href="/inversiones" className="shrink-0">
                <Button size="sm" className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1">
                  <span>Reordenar</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          )}

          {/* Alerta de Cuentas por Cobrar (Deudores) */}
          {(customerKpis?.debtors_count ?? 0) > 0 && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-300 dark:border-blue-800/80 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                  <Users className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                    Cobranzas Pendientes: {customerKpis?.debtors_count} {customerKpis?.debtors_count === 1 ? "Deudor" : "Deudores"}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300/90 mt-0.5">
                    Saldo por cobrar: <strong>${(customerKpis?.total_receivable_usd ?? 0).toFixed(2)} USD</strong> (≈ Bs. {(customerKpis?.total_receivable_ves ?? 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })})
                  </p>
                </div>
              </div>
              <Link href="/clientes" className="shrink-0">
                <Button size="sm" className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1">
                  <span>Cobrar</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 3. Cuadrícula de 4 Tarjetas de Resumen Financiero Ejecutivo (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Resumen de Inversiones */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Invertido
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Wallet className="size-4" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              {formatMoney(invSummary?.total_invested_usd || 0, invSummary?.total_invested_ves)}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {formatSecondaryMoney(invSummary?.total_invested_usd || 0, invSummary?.total_invested_ves)}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>{invSummary?.investments_count || 0} compras ({invSummary?.total_items_count || 0} uds)</span>
            <Link
              href="/inversiones"
              className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ver</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Resumen de Ventas */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Ventas Facturadas
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShoppingCart className="size-4" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
              {formatMoney(summary?.total_revenue_usd || 0, summary?.total_revenue_ves)}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {formatSecondaryMoney(summary?.total_revenue_usd || 0, summary?.total_revenue_ves)}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>{summary?.sales_count || 0} ventas ({summary?.total_items_sold || 0} uds)</span>
            <Link
              href="/ventas"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>Ventas</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 3: Ganancia Neta Real */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-950/20 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-emerald-900/5 dark:stroke-emerald-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Ganancia Neta Real
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="size-4" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              +{formatMoney(summary?.net_profit_usd || 0, summary?.net_profit_ves)}
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
              {formatSecondaryMoney(summary?.net_profit_usd || 0, summary?.net_profit_ves)}
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 pt-2 border-t border-emerald-500/20">
            <span>Ticket prom: {formatMoney(summary?.average_ticket_usd || 0, summary?.average_ticket_ves)}</span>
            <Link
              href="/ganancias"
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>Detalles</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Margen Financiero y Calidad */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70 flex flex-col justify-between group">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Márgenes de Rentabilidad
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Percent className="size-4" />
            </div>
          </div>

          <div className="relative z-10 my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                {grossMargin.toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500">s/ Ventas</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-neutral-600 dark:text-neutral-300">
                Markup: <strong>{markupMargin.toFixed(1)}%</strong>
              </span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${getMarginBadge(grossMargin).color}`}>
                {getMarginBadge(grossMargin).label}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span>COGS: {formatMoney(summary?.total_cogs_usd || 0, summary?.total_cogs_ves)}</span>
            <Link
              href="/ganancias"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Auditar</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Gráficos de Primera Fila: Evolución Completa y Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico 1: Evolución Financiera Integral (2/3 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-500" />
                <span>Evolución: Ventas, Costos y Ganancia Neta</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Comparativa temporal de compras vs ventas con datos agrupados por {granularity === "day" ? "día" : granularity === "week" ? "semana" : "mes"}.
              </p>
            </div>

            {/* Selector de Modo de Visualización */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMode("grouped")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === "grouped"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
                title="Ver Ventas, Costos y Ganancias en columnas lado a lado"
              >
                📊 Barras
              </button>
              <button
                type="button"
                onClick={() => setChartMode("stacked")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === "stacked"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
                title="Ver Costo + Ganancia apilados sumando el 100% de la venta"
              >
                🧱 Composición
              </button>
              <button
                type="button"
                onClick={() => setChartMode("line")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === "line"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs font-bold"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
                title="Ver líneas continuas de tendencia"
              >
                📈 Líneas
              </button>
            </div>
          </div>

          {/* Pastillas de Resumen Financiero del Período */}
          <div className="flex flex-wrap items-center gap-2 pb-2.5 mb-1 border-b border-neutral-100 dark:border-neutral-800/60 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
              <span className="size-2 rounded-full bg-indigo-500"></span>
              <span>Ventas: <strong>{formatMoney(totalRevenue, totalRevenue * bcvRate)}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-medium">
              <span className="size-2 rounded-full bg-slate-400"></span>
              <span>Costo COGS: <strong>{formatMoney(totalCogs, totalCogs * bcvRate)}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span>Ganancia Neta: <strong>{formatMoney(totalProfit, totalProfit * bcvRate)}</strong></span>
              <span className="text-[10px] opacity-75 font-bold">({grossMargin.toFixed(1)}%)</span>
            </span>
            <span className="ml-auto text-[11px] text-neutral-400 hidden sm:inline">
              {chartMode === "grouped" && "💡 Columnas lado a lado para comparar cada métrica"}
              {chartMode === "stacked" && "💡 Costo + Ganancia suman la Venta Total"}
              {chartMode === "line" && "💡 Curvas continuas de tendencia"}
            </span>
          </div>

          <div className="w-full min-h-[330px]">
            {analytics?.timeline && analytics.timeline.length > 0 ? (
              <Chart
                options={timelineOptions}
                series={timelineSeries}
                type={chartMode === "line" ? "line" : "bar"}
                height={330}
              />
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-800/30 text-center p-6">
                <Activity className="size-8 text-neutral-400 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Sin transacciones en este período
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Registra compras o ventas para visualizar la curva interactiva.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Desglose por Método de Pago (1/3 col) */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="size-4 text-indigo-500" />
              <span>Ventas por Método de Pago</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Distribución de ingresos por canal de cobro.
            </p>
          </div>

          <div className="w-full my-auto flex items-center justify-center min-h-[260px]">
            {analytics?.by_payment_method && analytics.by_payment_method.length > 0 ? (
              <Chart
                options={paymentOptions}
                series={paymentSeries}
                type="donut"
                height={280}
              />
            ) : (
              <div className="text-center p-6 text-neutral-400 text-xs">
                No hay métodos de pago registrados en el rango.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 flex justify-between">
            <span>Canales: {analytics?.by_payment_method.length || 0}</span>
            <span>Tasa BCV: {bcvRate.toFixed(2)} VES</span>
          </div>
        </div>
      </div>

      {/* 5. Gráficos de Segunda Fila: Curva de Margen Real y Top Productos Rentables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gráfico 3: Curva de Margen Real (%) */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-500" />
                <span>Salud del Margen de Ganancia (%)</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Rendimiento porcentual frente a la meta comercial recomendada (30%).
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              Prom: {grossMargin.toFixed(1)}%
            </span>
          </div>

          <div className="w-full min-h-[240px]">
            {analytics?.timeline && analytics.timeline.length > 0 ? (
              <Chart
                options={marginOptions}
                series={marginSeries}
                type="area"
                height={240}
              />
            ) : (
              <div className="flex h-52 items-center justify-center text-xs text-neutral-400">
                Sin datos de margen para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 4: Top Productos Más Rentables */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                <span>Top Productos con Mayor Ganancia Neta</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Artículos líderes que generan la mayor rentabilidad en tu negocio.
              </p>
            </div>
            <Link
              href="/ganancias"
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Ranking Completo →
            </Link>
          </div>

          <div className="w-full min-h-[240px]">
            {analytics?.top_products && analytics.top_products.length > 0 ? (
              <Chart
                options={topProductsOptions}
                series={topProductsSeries}
                type="bar"
                height={240}
              />
            ) : (
              <div className="flex h-52 items-center justify-center text-xs text-neutral-400">
                Sin ventas de productos registradas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Tabla Resumen de Desempeño y Módulos Activos */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              Desglose de Rentabilidad por Producto
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Detalle de ingresos brutos, costo deducido y ganancia neta en la moneda activa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/clientes">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                <Users className="size-3.5" />
                <span>Clientes</span>
              </Button>
            </Link>
            <Link href="/inversiones">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                <Wallet className="size-3.5" />
                <span>Inversiones</span>
              </Button>
            </Link>
            <Link href="/ventas">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                <ShoppingCart className="size-3.5" />
                <span>Historial de Ventas</span>
              </Button>
            </Link>
            <Link href="/ganancias">
              <Button size="sm" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <TrendingUp className="size-3.5" />
                <span>Reporte de Ganancias</span>
              </Button>
            </Link>
          </div>
        </div>

        {analytics?.top_products && analytics.top_products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-semibold">
                  <th className="pb-3 pl-1">Producto / Artículo</th>
                  <th className="pb-3 text-center">Unidades</th>
                  <th className="pb-3 text-right">Ingresos</th>
                  <th className="pb-3 text-right">Costo COGS</th>
                  <th className="pb-3 text-right">Ganancia Neta</th>
                  <th className="pb-3 text-right">Margen (%)</th>
                  <th className="pb-3 text-center pr-1">Aporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {analytics.top_products.slice(0, 5).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 pl-1 font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        {idx + 1}
                      </span>
                      <span>{prod.product_name}</span>
                    </td>
                    <td className="py-3 text-center text-neutral-600 dark:text-neutral-300">
                      {prod.units_sold} uds
                    </td>
                    <td className="py-3 text-right text-neutral-900 dark:text-neutral-200">
                      {formatMoney(prod.revenue_usd, prod.revenue_ves)}
                    </td>
                    <td className="py-3 text-right text-neutral-500">
                      {formatMoney(prod.cost_usd, prod.cost_ves)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(prod.profit_usd, prod.profit_ves)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getMarginBadge(prod.margin_percent).color}`}>
                        {prod.margin_percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-center pr-1">
                      <div className="w-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, prod.profit_share_percent))}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-0.5 block">
                        {prod.profit_share_percent.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No se registraron ventas en el período seleccionado. Puedes registrar tu primera venta con el botón superior.
          </div>
        )}
      </div>
    </div>
  );
}
