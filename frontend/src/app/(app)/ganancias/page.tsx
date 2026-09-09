"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Percent,
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coins,
  Receipt,
  Scale,
  Zap,
  Tag,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { ApexOptions } from "apexcharts";

// Dynamically import ReactApexChart to prevent SSR hydration errors in Next.js
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

interface CategoryProfitMetric {
  category: string;
  revenue_usd: number;
  revenue_ves: number;
  cost_usd: number;
  cost_ves: number;
  profit_usd: number;
  profit_ves: number;
  margin_percent: number;
  items_sold: number;
  sales_count: number;
  share_percent: number;
}

interface CashVsCreditProfit {
  total_sales_count: number;
  paid_sales_count: number;
  pending_sales_count: number;
  partial_sales_count: number;
  total_revenue_usd: number;
  total_paid_usd: number;
  total_debt_usd: number;
  realized_profit_usd: number;
  pending_profit_usd: number;
  collection_rate_percent: number;
}

interface SalesAnalyticsResponse {
  summary: SalesAnalyticsSummary;
  timeline: TimelinePoint[];
  by_payment_method: PaymentMethodMetric[];
  by_category?: CategoryProfitMetric[];
  cash_vs_credit?: CashVsCreditProfit;
  top_products: ProductProfitMetric[];
  profit_tiers: ProfitTiers;
  filter_preset?: string;
  start_date?: string;
  end_date?: string;
}

const PRESET_OPTIONS = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "7d" },
  { label: "Últimos 30 días", value: "30d" },
  { label: "Este Mes", value: "this_month" },
  { label: "Mes Anterior", value: "last_month" },
  { label: "Este Año", value: "this_year" },
  { label: "Histórico Total", value: "all" },
  { label: "Personalizado", value: "custom" },
];

export default function GananciasPage() {
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [preset, setPreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");

  // Product Matrix search & filter
  const [productSearch, setProductSearch] = useState("");
  const [marginFilter, setMarginFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  // Simulation & Goal State
  const [monthlyGoalUsd, setMonthlyGoalUsd] = useState(250);
  const [growthSimPercent, setGrowthSimPercent] = useState(15);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      let queryParams = `preset=${preset}&group_by=${groupBy}`;
      if (preset === "custom") {
        if (startDate) queryParams += `&start_date=${startDate}`;
        if (endDate) queryParams += `&end_date=${endDate}`;
      }
      const data = await apiFetch<SalesAnalyticsResponse>(`/sales/analytics?${queryParams}`);
      setAnalytics(data);
    } catch (err: any) {
      notify.error(err.message || "Error al cargar las analíticas financieras");
    } finally {
      setLoading(false);
    }
  }, [preset, startDate, endDate, groupBy]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Format currency helpers
  const formatMoney = (amount: number, forceCurrency?: "USD" | "VES") => {
    const c = forceCurrency || currency;
    if (c === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Bs. ${amount.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const bcvRate = analytics?.summary.current_bcv_rate || 807.39;

  // Filtered Products Matrix
  const filteredProducts = useMemo(() => {
    if (!analytics?.top_products) return [];
    return analytics.top_products.filter((p) => {
      const matchesSearch = p.product_name.toLowerCase().includes(productSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (marginFilter === "HIGH") return p.margin_percent >= 50;
      if (marginFilter === "MEDIUM") return p.margin_percent >= 20 && p.margin_percent < 50;
      if (marginFilter === "LOW") return p.margin_percent < 20;
      return true;
    });
  }, [analytics?.top_products, productSearch, marginFilter]);

  // Export to CSV helper
  const exportToCSV = () => {
    if (!analytics || filteredProducts.length === 0) {
      notify.error("No hay datos disponibles para exportar");
      return;
    }

    const headers = [
      "Producto",
      "Unidades Vendidas",
      "Ingresos USD",
      "Ingresos VES",
      "Costo USD",
      "Costo VES",
      "Ganancia Neta USD",
      "Ganancia Neta VES",
      "Margen %",
      "Aporte a Ganancia %",
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.product_name.replace(/"/g, '""')}"`,
      p.units_sold,
      p.revenue_usd.toFixed(2),
      p.revenue_ves.toFixed(2),
      p.cost_usd.toFixed(2),
      p.cost_ves.toFixed(2),
      p.profit_usd.toFixed(2),
      p.profit_ves.toFixed(2),
      p.margin_percent.toFixed(2) + "%",
      p.profit_share_percent.toFixed(2) + "%",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ganancias_quadralo_${preset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success("Reporte CSV descargado con éxito");
  };

  // 1. Chart Options: Timeline Evolution (Revenue, Costs, Net Profit)
  const timelineCategories = analytics?.timeline.map((t) => t.label) || [];
  const timelineRevenue = analytics?.timeline.map((t) => (currency === "USD" ? t.revenue_usd : t.revenue_ves)) || [];
  const timelineCost = analytics?.timeline.map((t) => (currency === "USD" ? t.cost_usd : t.cost_ves)) || [];
  const timelineProfit = analytics?.timeline.map((t) => (currency === "USD" ? t.profit_usd : t.profit_ves)) || [];

  const evolutionChartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 340,
      toolbar: { show: true, tools: { download: true, zoom: false, pan: false } },
      fontFamily: "inherit",
      background: "transparent",
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    stroke: {
      curve: "smooth",
      width: [3, 2, 2],
    },
    colors: ["#10b981", "#6366f1", "#f59e0b"],
    fill: {
      type: ["gradient", "solid", "solid"],
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#059669"],
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    labels: timelineCategories,
    xaxis: {
      categories: timelineCategories,
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px" },
        formatter: (val) => {
          if (currency === "USD") return `$${val.toFixed(0)}`;
          return `Bs. ${val.toLocaleString("es-VE", { maximumFractionDigits: 0 })}`;
        },
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.15)",
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => {
          if (currency === "USD") return `$${val.toFixed(2)}`;
          return `Bs. ${val.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#94a3b8" },
      markers: { size: 6 },
    },
  };

  const evolutionSeries = [
    {
      name: "Ganancia Neta",
      type: "area",
      data: timelineProfit,
    },
    {
      name: "Ingreso Bruto",
      type: "line",
      data: timelineRevenue,
    },
    {
      name: "Costo de Mercancía",
      type: "column",
      data: timelineCost,
    },
  ];

  // 2. Chart Options: Profit Margin % Evolution
  const timelineMargins = analytics?.timeline.map((t) => t.margin_percent) || [];
  const marginChartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 260,
      toolbar: { show: false },
      fontFamily: "inherit",
      background: "transparent",
    },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#8b5cf6"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        gradientToColors: ["#a855f7"],
        shadeIntensity: 1,
        type: "vertical",
        opacityFrom: 0.5,
        opacityTo: 0.05,
      },
    },
    colors: ["#8b5cf6"],
    xaxis: {
      categories: timelineCategories,
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px" },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px" },
        formatter: (val) => `${val.toFixed(0)}%`,
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.15)",
      strokeDashArray: 4,
    },
    annotations: {
      yaxis: [
        {
          y: 30,
          borderColor: "#10b981",
          strokeDashArray: 4,
          label: {
            borderColor: "#10b981",
            style: { color: "#fff", background: "#10b981", fontSize: "10px", fontWeight: 600 },
            text: "Umbral Óptimo (30%)",
          },
        },
      ],
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `${val.toFixed(1)}% margen`,
      },
    },
  };

  const marginSeries = [
    {
      name: "Margen de Ganancia (%)",
      data: timelineMargins,
    },
  ];

  // 3. Chart Options: Payment Methods Donut
  const paymentMethodsLabels = analytics?.by_payment_method.map((p) => p.method) || [];
  const paymentMethodsSeries =
    analytics?.by_payment_method.map((p) => (currency === "USD" ? p.profit_usd : p.profit_ves)) || [];

  const paymentDonutOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 280,
      fontFamily: "inherit",
      background: "transparent",
    },
    labels: paymentMethodsLabels,
    colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6", "#64748b"],
    legend: {
      position: "bottom",
      labels: { colors: "#94a3b8" },
      fontSize: "12px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Ganancia Total",
              color: "#94a3b8",
              fontSize: "12px",
              formatter: () => {
                const total = paymentMethodsSeries.reduce((a, b) => a + b, 0);
                return formatMoney(total);
              },
            },
            value: {
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              formatter: (val) => formatMoney(Number(val)),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => formatMoney(Number(val)),
      },
    },
  };

  // 4. Chart Options: Top Products Horizontal Bar
  const topProductsList = analytics?.top_products.slice(0, 6) || [];
  const productBarCategories = topProductsList.map((p) => p.product_name);
  const productBarProfit = topProductsList.map((p) => (currency === "USD" ? p.profit_usd : p.profit_ves));

  const productBarOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 280,
      toolbar: { show: false },
      fontFamily: "inherit",
      background: "transparent",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: "60%",
        distributed: true,
      },
    },
    colors: ["#10b981", "#059669", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
    dataLabels: {
      enabled: true,
      formatter: (val) => formatMoney(Number(val)),
      style: { fontSize: "11px", fontWeight: 600 },
      offsetX: 10,
    },
    xaxis: {
      categories: productBarCategories,
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px" },
        formatter: (val) => {
          if (currency === "USD") return `$${val}`;
          return `Bs. ${val}`;
        },
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#94a3b8", fontSize: "11px", fontWeight: 500 },
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.15)",
      strokeDashArray: 4,
    },
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => formatMoney(Number(val)),
      },
    },
  };

  const productBarSeries = [
    {
      name: "Ganancia Neta",
      data: productBarProfit,
    },
  ];

  // 5. Chart Options: Category Profit Donut
  const categoryLabels = analytics?.by_category?.map((c) => c.category) || [];
  const categorySeries =
    analytics?.by_category?.map((c) => (currency === "USD" ? c.profit_usd : c.profit_ves)) || [];

  const categoryDonutOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 280,
      fontFamily: "inherit",
      background: "transparent",
    },
    labels: categoryLabels,
    colors: ["#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#84cc16"],
    legend: {
      position: "bottom",
      labels: { colors: "#94a3b8" },
      fontSize: "12px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Ganancia Total",
              color: "#94a3b8",
              fontSize: "12px",
              formatter: () => {
                const total = categorySeries.reduce((a, b) => a + b, 0);
                return formatMoney(total);
              },
            },
            value: {
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              formatter: (val) => formatMoney(Number(val)),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => formatMoney(Number(val)),
      },
    },
  };

  // Simulation calculations
  const currentNetProfitUsd = analytics?.summary.net_profit_usd || 0;
  const simulatedExtraProfitUsd = (currentNetProfitUsd * (growthSimPercent / 100));
  const simulatedTotalProfitUsd = currentNetProfitUsd + simulatedExtraProfitUsd;
  const goalProgressPercent = monthlyGoalUsd > 0 ? Math.min(100, Math.round((currentNetProfitUsd / monthlyGoalUsd) * 100)) : 0;
  const goalRemainingUsd = Math.max(0, monthlyGoalUsd - currentNetProfitUsd);

  return (
    <div className="flex flex-1 flex-col gap-6 pb-12">
      {/* Header Banner & Breadcrumbs */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white via-neutral-50/80 to-emerald-50/30 p-6 shadow-xs dark:border-neutral-800 dark:from-neutral-900/90 dark:via-neutral-900/50 dark:to-emerald-950/20">
        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Módulo de Ganancias & Rentabilidad
              </h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                En Vivo
              </span>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Visualiza en tiempo real tus ingresos, costo de inventario, márgenes netos y proyecciones de rentabilidad.
            </p>
          </div>

          {/* Right Actions: Currency Toggle & BCV indicator */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center rounded-xl border border-neutral-200 bg-white/90 p-1 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/90">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  currency === "USD"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                <DollarSign className="size-3.5" />
                <span>USD ($)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency("VES")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  currency === "VES"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                <Coins className="size-3.5" />
                <span>VES (Bs.)</span>
              </button>
            </div>

            {/* BCV Rate Pill */}
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-neutral-700 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-neutral-500 dark:text-neutral-400">BCV:</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                Bs. {bcvRate.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
              className="rounded-xl border-neutral-200 dark:border-neutral-800 shadow-2xs"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200/60 pt-4 dark:border-neutral-800/60">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-1 flex items-center gap-1">
              <Calendar className="size-3.5" /> Período:
            </span>
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPreset(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  preset === opt.value
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs"
                    : "bg-white/60 text-neutral-600 hover:bg-neutral-200/60 dark:bg-neutral-800/60 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Granularity & Custom Range */}
          <div className="flex flex-wrap items-center gap-2">
            {preset === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs w-32 rounded-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                />
                <span className="text-xs text-neutral-400">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs w-32 rounded-lg bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
                />
              </div>
            )}

            {/* Interval Granularity */}
            <div className="flex items-center rounded-lg border border-neutral-200 bg-white/70 p-0.5 text-xs dark:border-neutral-800 dark:bg-neutral-900">
              {(["day", "week", "month"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroupBy(g)}
                  className={`rounded-md px-2 py-0.5 capitalize transition-all ${
                    groupBy === g
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {g === "day" ? "Día" : g === "week" ? "Sem" : "Mes"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Ganancia Neta Real */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white p-4 shadow-2xs dark:border-emerald-950/60 dark:from-emerald-950/20 dark:via-neutral-900 dark:to-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <span>Ganancia Neta</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {analytics ? formatMoney(currency === "USD" ? analytics.summary.net_profit_usd : analytics.summary.net_profit_ves) : "..."}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              ≈ {analytics ? formatMoney(currency === "USD" ? analytics.summary.net_profit_ves : analytics.summary.net_profit_usd, currency === "USD" ? "VES" : "USD") : "..."}
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="size-3" />
            <span>Beneficio real en caja</span>
          </div>
        </div>

        {/* KPI 2: Ingresos Brutos */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Ventas Brutas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {analytics ? formatMoney(currency === "USD" ? analytics.summary.total_revenue_usd : analytics.summary.total_revenue_ves) : "..."}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {analytics ? `${analytics.summary.sales_count} ventas (${analytics.summary.total_items_sold} uds)` : "..."}
            </p>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            Ticket prom: {analytics ? formatMoney(currency === "USD" ? analytics.summary.average_ticket_usd : analytics.summary.average_ticket_ves) : "..."}
          </div>
        </div>

        {/* KPI 3: Costo de Mercancía Vendida (COGS) */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Costo Mercancía (COGS)</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {analytics ? formatMoney(currency === "USD" ? analytics.summary.total_cogs_usd : analytics.summary.total_cogs_ves) : "..."}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Costo base + flete deducido
            </p>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            ≈ {analytics ? formatMoney(currency === "USD" ? analytics.summary.total_cogs_ves : analytics.summary.total_cogs_usd, currency === "USD" ? "VES" : "USD") : "..."}
          </div>
        </div>

        {/* KPI 4: Margen sobre Venta (Gross Margin %) */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Margen s/ Venta</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Percent className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {analytics ? `${analytics.summary.gross_margin_percent.toFixed(1)}%` : "0.0%"}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Ganancia / Ingresos
            </p>
          </div>
          <div className="mt-2 text-[11px] font-medium text-purple-600 dark:text-purple-400">
            De cada $100 ingresados
          </div>
        </div>

        {/* KPI 5: Margen s/ Costo (Markup %) */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Margen s/ Costo</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Scale className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {analytics ? `+${analytics.summary.markup_margin_percent.toFixed(1)}%` : "+0.0%"}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Markup sobre inversión
            </p>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            Rentabilidad del inventario
          </div>
        </div>

        {/* KPI 6: Salud de Márgenes */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <span>Calidad Márgenes</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {analytics ? `${analytics.profit_tiers.high_margin_count} altos` : "0"}
            </div>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {analytics ? `${analytics.profit_tiers.medium_margin_count} medios · ${analytics.profit_tiers.low_margin_count} bajos` : "0"}
            </p>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            Transacciones &gt; 50%
          </div>
        </div>
      </div>

      {/* Main Charts Row: Timeline Evolution & Margins Trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Mixed Evolution Chart */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="size-4 text-emerald-500" />
                Evolución de Ingresos, Costos y Ganancia Neta
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Flujo comparativo de ingresos contra costo de reposición de mercancía.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                {currency === "USD" ? "Valores en USD" : "Valores en VES"}
              </span>
            </div>
          </div>

          {timelineCategories.length > 0 ? (
            <div className="w-full">
              <Chart options={evolutionChartOptions} series={evolutionSeries} type="line" height={340} />
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center text-center p-6">
              <Receipt className="size-10 text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No hay transacciones en este rango de fechas
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                Selecciona un rango más amplio o registra nuevas ventas para visualizar la evolución.
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Margins % Trajectory */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="mb-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Percent className="size-4 text-purple-500" />
              Tendencia del Margen (%)
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Margen de ganancia promedio por fecha con umbral óptimo del 30%.
            </p>
          </div>

          {timelineCategories.length > 0 ? (
            <div className="w-full">
              <Chart options={marginChartOptions} series={marginSeries} type="area" height={260} />
              <div className="mt-4 rounded-xl bg-purple-50/50 p-3 border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-purple-900 dark:text-purple-300">Margen Promedio Global:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                    {analytics ? `${analytics.summary.markup_margin_percent.toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6">
              <p className="text-xs text-neutral-500">Sin datos para la curva de márgenes.</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Charts Row: Payment Methods & Top Products */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Payment Methods Distribution */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="size-4 text-emerald-500" />
                Ganancias por Método de Pago
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Distribución de utilidades según cómo cobraste a tus clientes.
              </p>
            </div>
          </div>

          {paymentMethodsLabels.length > 0 ? (
            <div className="w-full">
              <Chart options={paymentDonutOptions} series={paymentMethodsSeries} type="donut" height={280} />
              
              {/* Payment Methods breakdown list */}
              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                {analytics?.by_payment_method.map((pm) => (
                  <div key={pm.method} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500"></span>
                      {pm.method} ({pm.sales_count} ventas)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatMoney(currency === "USD" ? pm.profit_usd : pm.profit_ves)}
                      </span>
                      <span className="text-neutral-400">({pm.share_percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6">
              <p className="text-xs text-neutral-500">Sin datos de métodos de pago.</p>
            </div>
          )}
        </div>

        {/* Right: Top Products by Profit */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Award className="size-4 text-amber-500" />
                Top Productos Más Rentables
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Artículos que mayor ganancia neta generan para tu negocio.
              </p>
            </div>
          </div>

          {productBarCategories.length > 0 ? (
            <div className="w-full">
              <Chart options={productBarOptions} series={productBarSeries} type="bar" height={280} />
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center p-6">
              <p className="text-xs text-neutral-500">Sin datos de productos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Third Charts Row: Category Profitability & Cash vs. Credit Realized Profit */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Category Profitability & Margin Ranking Table */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 lg:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Tag className="size-4 text-emerald-500" />
                Rentabilidad por Categoría de Producto
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                ¿Qué líneas de producto te dejan más beneficio neto y mejor margen porcentual?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                {analytics?.by_category?.length || 0} categorías
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Donut Chart: 5 cols */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              {categoryLabels.length > 0 ? (
                <div className="w-full">
                  <Chart options={categoryDonutOptions} series={categorySeries} type="donut" height={260} />
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center text-center p-4">
                  <p className="text-xs text-neutral-500">Sin datos de categorías para este período.</p>
                </div>
              )}
            </div>

            {/* Ranking Table: 7 cols */}
            <div className="md:col-span-7 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="pb-2">Categoría</th>
                    <th className="pb-2 text-right">Vendido</th>
                    <th className="pb-2 text-right">Ganancia Neta</th>
                    <th className="pb-2 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {analytics?.by_category && analytics.by_category.length > 0 ? (
                    analytics.by_category.map((cat, idx) => (
                      <tr key={cat.category} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2.5 font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[120px]">{cat.category}</span>
                        </td>
                        <td className="py-2.5 text-right text-neutral-500">
                          {cat.items_sold} uds ({formatMoney(currency === "USD" ? cat.revenue_usd : cat.revenue_ves)})
                        </td>
                        <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(currency === "USD" ? cat.profit_usd : cat.profit_ves)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {cat.margin_percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-neutral-400">
                        No hay datos categorizados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Cash vs. Credit Realized Profit Widget */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Coins className="size-4 text-emerald-500" />
                  Contado vs. Créditos
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Ganancia Realizada vs. Ganancia por Cobrar
                </p>
              </div>
            </div>

            {/* Progress Bar Collection Rate */}
            <div className="mt-2 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-500 font-medium">Tasa de Cobranza / Recaudación:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {analytics?.cash_vs_credit ? `${analytics.cash_vs_credit.collection_rate_percent.toFixed(1)}%` : "100%"}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics?.cash_vs_credit?.collection_rate_percent || 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-neutral-400">
                Cobrado: ${analytics?.cash_vs_credit?.total_paid_usd.toFixed(2) || "0.00"} de $
                {analytics?.cash_vs_credit?.total_revenue_usd.toFixed(2) || "0.00"} facturados
              </p>
            </div>

            {/* Comparison Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="block text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400">
                  Ganancia Realizada
                </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  ${analytics?.cash_vs_credit?.realized_profit_usd.toFixed(2) || "0.00"}
                </span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Efectivo cobrado en caja</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="block text-[10px] uppercase font-semibold text-amber-700 dark:text-amber-400">
                  Ganancia en Crédito
                </span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  ${analytics?.cash_vs_credit?.pending_profit_usd.toFixed(2) || "0.00"}
                </span>
                <p className="text-[10px] text-neutral-500 mt-0.5">Pendiente por cobrar</p>
              </div>
            </div>

            {/* Breakdown Pills */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Ventas al Contado (100% Pagadas):
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {analytics?.cash_vs_credit?.paid_sales_count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-500" />
                  Ventas con Abonos Parciales:
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {analytics?.cash_vs_credit?.partial_sales_count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-rose-500" />
                  Ventas a Crédito 100% Pendientes:
                </span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {analytics?.cash_vs_credit?.pending_sales_count || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400">Gestión de Cuentas:</span>
            <Link
              href="/clientes"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              Ver Deudores & Cobranzas &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Product Profitability Matrix Table */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="border-b border-neutral-200/80 p-5 dark:border-neutral-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Layers className="size-4 text-emerald-500" />
              Matriz Detallada de Rentabilidad por Producto
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Desglose unitario de ingresos, costo deducido, ganancia neta y aporte al beneficio global.
            </p>
          </div>

          {/* Search, Filter & CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-8 pl-8 text-xs w-44 rounded-lg bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
              />
            </div>

            {/* Margin Filter */}
            <select
              value={marginFilter}
              onChange={(e) => setMarginFilter(e.target.value as any)}
              className="h-8 rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              <option value="ALL">Todos los márgenes</option>
              <option value="HIGH">Alta Rentabilidad (&gt;50%)</option>
              <option value="MEDIUM">Saludable (20% - 50%)</option>
              <option value="LOW">Bajo Margen (&lt;20%)</option>
            </select>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-8 text-xs gap-1.5 rounded-lg border-neutral-200 dark:border-neutral-700"
            >
              <Download className="size-3.5" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200/80 bg-neutral-50/70 font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400">
              <tr>
                <th className="px-5 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Uds Vendidas</th>
                <th className="px-4 py-3 text-right">Ingreso Bruto</th>
                <th className="px-4 py-3 text-right">Costo Total</th>
                <th className="px-4 py-3 text-right">Ganancia Neta</th>
                <th className="px-4 py-3 text-center">Margen (%)</th>
                <th className="px-5 py-3">Aporte al Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isHigh = p.margin_percent >= 50;
                  const isMed = p.margin_percent >= 20 && p.margin_percent < 50;
                  return (
                    <tr
                      key={p.product_name}
                      className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                    >
                      <td className="px-5 py-3 font-semibold text-neutral-900 dark:text-white">
                        {p.product_name}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-neutral-700 dark:text-neutral-300">
                        {p.units_sold} uds
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-800 dark:text-neutral-200">
                        {formatMoney(currency === "USD" ? p.revenue_usd : p.revenue_ves)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500 dark:text-neutral-400">
                        {formatMoney(currency === "USD" ? p.cost_usd : p.cost_ves)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(currency === "USD" ? p.profit_usd : p.profit_ves)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isHigh
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                              : isMed
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                          }`}
                        >
                          +{p.margin_percent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, p.profit_share_percent))}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-neutral-500 font-medium">
                            {p.profit_share_percent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-neutral-400">
                    No se encontraron productos coincidentes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator & Goal Tracker Widget */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Widget 1: Meta Mensual de Ganancia */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white to-emerald-50/20 p-5 shadow-xs dark:border-neutral-800 dark:from-neutral-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <Target className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Meta Mensual de Ganancia Neta
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-500">Meta ($):</span>
              <Input
                type="number"
                value={monthlyGoalUsd}
                onChange={(e) => setMonthlyGoalUsd(Number(e.target.value) || 0)}
                className="h-7 w-20 text-xs text-right font-bold rounded-md bg-white dark:bg-neutral-800"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-neutral-600 dark:text-neutral-400">
                Progreso actual: <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(currentNetProfitUsd, "USD")}</strong>
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">{goalProgressPercent}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${goalProgressPercent}%` }}
              ></div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                {goalRemainingUsd > 0
                  ? `Faltan ${formatMoney(goalRemainingUsd, "USD")} (≈ ${formatMoney(goalRemainingUsd * bcvRate, "VES")})`
                  : "¡Meta mensual superada con éxito! 🎉"}
              </span>
              <span>Objetivo: ${monthlyGoalUsd.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Simulador What-If de Crecimiento */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white to-purple-50/20 p-5 shadow-xs dark:border-neutral-800 dark:from-neutral-900 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                <Zap className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Simulador de Escenarios de Ganancia
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {[10, 15, 25].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setGrowthSimPercent(pct)}
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-all ${
                    growthSimPercent === pct
                      ? "bg-purple-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-purple-50/70 p-3 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/40">
            <div>
              <p className="text-xs text-purple-900 dark:text-purple-300 font-medium">
                Si incrementas tus ventas un <strong>+{growthSimPercent}%</strong>:
              </p>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-400 mt-0.5">
                {formatMoney(simulatedTotalProfitUsd, "USD")}
                <span className="text-xs font-normal text-neutral-500 ml-1.5">
                  (≈ {formatMoney(simulatedTotalProfitUsd * bcvRate, "VES")})
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold block">
                Ganancia extra estimada:
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{formatMoney(simulatedExtraProfitUsd, "USD")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
