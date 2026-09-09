"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import {
  Plus,
  Wallet,
  DollarSign,
  Package,
  Truck,
  Trash2,
  TrendingDown,
  Calculator,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Eye,
  Calendar,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface Investment {
  id: string;
  product_name: string;
  category: string;
  amount_ves: number;
  bcv_rate: number;
  amount_usd: number;
  quantity: number;
  initial_quantity?: number;
  min_stock_alert?: number;
  stock_status?: string;
  shipping_cost_ves: number;
  shipping_cost_usd: number;
  total_cost_usd: number;
  unit_cost_usd: number;
  unit_cost_ves: number;
  notes?: string;
  created_at: string;
}

interface Summary {
  total_invested_usd: number;
  total_invested_ves: number;
  total_items_count: number;
  total_initial_items?: number;
  total_sold_items?: number;
  total_shipping_usd: number;
  total_shipping_ves?: number;
  investments_count: number;
  current_bcv_rate: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
}

export default function InversionesPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search, filter and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "cost_desc">("date_desc");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low_stock" | "out_of_stock" | "in_stock">("all");

  // Create Modal states
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("General");
  const [amountVes, setAmountVes] = useState("");
  const [bcvRate, setBcvRate] = useState("75.50");
  const [quantity, setQuantity] = useState("1");
  const [minStockAlert, setMinStockAlert] = useState("3");
  const [shippingCostVes, setShippingCostVes] = useState("0");
  const [notes, setNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal states
  const [openEditModal, setOpenEditModal] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editAmountVes, setEditAmountVes] = useState("");
  const [editBcvRate, setEditBcvRate] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editMinStockAlert, setEditMinStockAlert] = useState("3");
  const [editShippingCostVes, setEditShippingCostVes] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Reorder Modal states
  const [openReorderModal, setOpenReorderModal] = useState(false);
  const [reorderItem, setReorderItem] = useState<Investment | null>(null);
  const [reorderQuantity, setReorderQuantity] = useState("10");
  const [reorderBcvRate, setReorderBcvRate] = useState("");
  const [reorderAmountVes, setReorderAmountVes] = useState("");
  const [reorderShippingVes, setReorderShippingVes] = useState("0");
  const [reorderMinStock, setReorderMinStock] = useState("3");
  const [reorderNotes, setReorderNotes] = useState("");
  const [submittingReorder, setSubmittingReorder] = useState(false);

  // Detail Modal states
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Investment | null>(null);

  // Delete Confirmation Modal states
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Investment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Live calculation helpers for CREATE
  const numAmountVes = parseFloat(amountVes) || 0;
  const numBcvRate = parseFloat(bcvRate) || 1;
  const numQuantity = parseInt(quantity) || 1;
  const numShippingVes = parseFloat(shippingCostVes) || 0;

  const liveAmountUsd = numBcvRate > 0 ? numAmountVes / numBcvRate : 0;
  const liveShippingUsd = numBcvRate > 0 ? numShippingVes / numBcvRate : 0;
  const liveTotalUsd = liveAmountUsd + liveShippingUsd;
  const liveTotalVes = numAmountVes + numShippingVes;
  const liveUnitUsd = numQuantity > 0 ? liveTotalUsd / numQuantity : 0;
  const liveUnitVes = liveUnitUsd * numBcvRate;

  // Live calculation helpers for EDIT
  const editNumAmountVes = parseFloat(editAmountVes) || 0;
  const editNumBcvRate = parseFloat(editBcvRate) || 1;
  const editNumQuantity = parseInt(editQuantity) || 1;
  const editNumShippingVes = parseFloat(editShippingCostVes) || 0;

  const editLiveAmountUsd = editNumBcvRate > 0 ? editNumAmountVes / editNumBcvRate : 0;
  const editLiveShippingUsd = editNumBcvRate > 0 ? editNumShippingVes / editNumBcvRate : 0;
  const editLiveTotalUsd = editLiveAmountUsd + editLiveShippingUsd;
  const editLiveTotalVes = editNumAmountVes + editNumShippingVes;
  const editLiveUnitUsd = editNumQuantity > 0 ? editLiveTotalUsd / editNumQuantity : 0;
  const editLiveUnitVes = editLiveUnitUsd * editNumBcvRate;

  const roundToTwo = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const availableCategories = useMemo(() => {
    const set = new Set<string>(["General", ...categories]);
    investments.forEach((inv) => {
      if (inv.category && inv.category.trim()) {
        set.add(inv.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [categories, investments]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, sumData, catsData] = await Promise.all([
        apiFetch<Investment[]>("/investments/"),
        apiFetch<Summary>("/investments/summary"),
        apiFetch<string[]>("/investments/categories").catch(() => ["General"]),
      ]);
      setInvestments(invData);
      setSummary(sumData);
      if (catsData) {
        setCategories(catsData);
      }
      if (sumData.current_bcv_rate) {
        setBcvRate(sumData.current_bcv_rate.toString());
      }
    } catch (err: any) {
      console.error("Error al cargar inversiones:", err);
      notify.error("Error al sincronizar datos", err.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: CREATE ---
  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (numAmountVes <= 0) {
      setCreateError("El monto en bolívares debe ser mayor a 0");
      notify.warning("Monto no válido", "Por favor ingresa un monto en VES superior a 0.");
      return;
    }
    if (numBcvRate <= 0) {
      setCreateError("La tasa BCV debe ser mayor a 0");
      notify.warning("Tasa no válida", "La tasa de cambio debe ser superior a 0.");
      return;
    }
    if (numQuantity <= 0) {
      setCreateError("La cantidad debe ser al menos 1 unidad");
      notify.warning("Cantidad requerida", "Ingresa una cantidad válida de unidades.");
      return;
    }

    setSubmittingCreate(true);

    try {
      const created = await apiFetch<Investment>("/investments/", {
        method: "POST",
        body: JSON.stringify({
          product_name: productName.trim(),
          category: category.trim() || "General",
          amount_ves: numAmountVes,
          bcv_rate: numBcvRate,
          quantity: numQuantity,
          min_stock_alert: parseInt(minStockAlert) || 3,
          shipping_cost_ves: numShippingVes,
          shipping_cost_usd: liveShippingUsd,
          notes: notes.trim() || undefined,
        }),
      });

      notify.success("Inversión registrada", `"${created.product_name}" se guardó con éxito en categoría "${created.category || "General"}".`);

      // Reset form and close
      setProductName("");
      setCategory("General");
      setAmountVes("");
      setQuantity("1");
      setMinStockAlert("3");
      setShippingCostVes("0");
      setNotes("");
      setOpenCreateModal(false);
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || "Error al registrar la inversión");
      notify.error("Error al crear inversión", err.message || "Revisa los campos e intenta nuevamente.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // --- CRUD: OPEN EDIT MODAL ---
  const handleOpenEdit = (inv: Investment) => {
    setEditingItem(inv);
    setEditProductName(inv.product_name);
    setEditCategory(inv.category || "General");
    setEditAmountVes(inv.amount_ves.toString());
    setEditBcvRate(inv.bcv_rate.toString());
    setEditQuantity((inv.initial_quantity || inv.quantity).toString());
    setEditMinStockAlert((inv.min_stock_alert || 3).toString());
    const vesShipping = inv.shipping_cost_ves !== undefined 
      ? inv.shipping_cost_ves 
      : roundToTwo(inv.shipping_cost_usd * inv.bcv_rate);
    setEditShippingCostVes(vesShipping.toString());
    setEditNotes(inv.notes || "");
    setEditError(null);
    setOpenEditModal(true);
  };

  // --- CRUD: UPDATE ---
  const handleUpdateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editNumAmountVes <= 0) {
      setEditError("El monto en bolívares debe ser mayor a 0");
      notify.warning("Monto no válido", "Por favor ingresa un monto en VES superior a 0.");
      return;
    }
    if (editNumBcvRate <= 0) {
      setEditError("La tasa BCV debe ser mayor a 0");
      notify.warning("Tasa no válida", "La tasa de cambio debe ser superior a 0.");
      return;
    }
    if (editNumQuantity <= 0) {
      setEditError("La cantidad debe ser al menos 1 unidad");
      return;
    }

    const initialQty = editingItem.initial_quantity || editingItem.quantity;
    const soldUnits = Math.max(0, initialQty - editingItem.quantity);
    if (editNumQuantity < soldUnits) {
      setEditError(`La cantidad total del lote no puede ser menor a ${soldUnits} unidades porque ya se vendieron ${soldUnits} uds.`);
      notify.warning("Cantidad insuficiente", `Ya se registraron ventas de este lote (${soldUnits} uds vendidas).`);
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);

    try {
      await apiFetch<Investment>(`/investments/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          product_name: editProductName.trim(),
          category: editCategory.trim() || "General",
          amount_ves: editNumAmountVes,
          bcv_rate: editNumBcvRate,
          quantity: editNumQuantity,
          min_stock_alert: parseInt(editMinStockAlert) || 3,
          shipping_cost_ves: editNumShippingVes,
          shipping_cost_usd: editLiveShippingUsd,
          notes: editNotes.trim() || undefined,
        }),
      });

      notify.success(
        "Inversión actualizada",
        `"${editProductName}" actualizada con recálculo automático.`
      );

      setOpenEditModal(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar la inversión");
      notify.error("Error al actualizar", err.message || "No se pudo guardar la modificación.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // --- REORDER MODAL HANDLERS ---
  const handleOpenReorder = (inv: Investment) => {
    setReorderItem(inv);
    setReorderQuantity((inv.initial_quantity || 10).toString());
    const rate = summary?.current_bcv_rate ? summary.current_bcv_rate.toString() : inv.bcv_rate.toString();
    setReorderBcvRate(rate);
    const rateNum = parseFloat(rate) || inv.bcv_rate || 75.5;
    const estQty = inv.initial_quantity || 10;
    const estTotalUsd = inv.unit_cost_usd * estQty;
    setReorderAmountVes((estTotalUsd * rateNum).toFixed(2));
    setReorderShippingVes("0");
    setReorderMinStock((inv.min_stock_alert || 3).toString());
    setReorderNotes(`Reorden de lote anterior (${inv.id.slice(0, 8)})`);
    setOpenReorderModal(true);
  };

  const handleConfirmReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItem) return;
    const q = parseInt(reorderQuantity);
    if (isNaN(q) || q <= 0) {
      notify.warning("Cantidad requerida", "La cantidad debe ser mayor a 0.");
      return;
    }

    try {
      setSubmittingReorder(true);
      await apiFetch<Investment>(`/investments/${reorderItem.id}/reorder`, {
        method: "POST",
        body: JSON.stringify({
          quantity: q,
          bcv_rate: parseFloat(reorderBcvRate) || undefined,
          amount_ves: parseFloat(reorderAmountVes) || undefined,
          shipping_cost_ves: parseFloat(reorderShippingVes) || 0,
          min_stock_alert: parseInt(reorderMinStock) || 3,
          notes: reorderNotes.trim() || undefined,
        }),
      });

      notify.success(
        "¡Lote Reabastecido!",
        `Se registró un nuevo lote de ${q} unidades para "${reorderItem.product_name}".`
      );

      setOpenReorderModal(false);
      setReorderItem(null);
      await loadData();
    } catch (err: any) {
      notify.error("Error al reabastecer", err.message || "No se pudo procesar el reorden.");
    } finally {
      setSubmittingReorder(false);
    }
  };

  // --- CRUD: OPEN DETAIL MODAL ---
  const handleOpenDetail = (inv: Investment) => {
    setDetailItem(inv);
    setOpenDetailModal(true);
  };

  // --- CRUD: OPEN DELETE CONFIRMATION ---
  const handleOpenDelete = (inv: Investment) => {
    setItemToDelete(inv);
    setOpenDeleteModal(true);
  };

  // --- CRUD: DELETE ---
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      await apiFetch(`/investments/${itemToDelete.id}`, {
        method: "DELETE",
      });

      notify.success(
        "Inversión eliminada",
        `"${itemToDelete.product_name}" fue eliminada del sistema.`
      );

      setOpenDeleteModal(false);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      notify.error("Error al eliminar", err.message || "No se pudo eliminar el registro.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered and sorted investments
  const filteredInvestments = useMemo(() => {
    let result = investments.filter((inv) => {
      const currentCat = inv.category || "General";
      const matchesCategory =
        selectedCategory === "Todas" ||
        currentCat.toLowerCase() === selectedCategory.toLowerCase();

      // Filtro de estado de inventario / stock
      if (stockStatusFilter === "low_stock") {
        const minAlert = inv.min_stock_alert ?? 3;
        if (!(inv.quantity > 0 && inv.quantity <= minAlert)) return false;
      } else if (stockStatusFilter === "out_of_stock") {
        if (inv.quantity > 0) return false;
      } else if (stockStatusFilter === "in_stock") {
        const minAlert = inv.min_stock_alert ?? 3;
        if (inv.quantity <= minAlert) return false;
      }

      const q = searchQuery.toLowerCase();
      const matchProduct = inv.product_name.toLowerCase().includes(q);
      const matchCat = currentCat.toLowerCase().includes(q);
      const matchNotes = inv.notes ? inv.notes.toLowerCase().includes(q) : false;

      return matchesCategory && (matchProduct || matchCat || matchNotes);
    });

    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "amount_desc") {
        return b.total_cost_usd - a.total_cost_usd;
      }
      if (sortBy === "cost_desc") {
        return b.unit_cost_usd - a.unit_cost_usd;
      }
      return 0;
    });

    return result;
  }, [investments, searchQuery, sortBy, selectedCategory]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Módulo de Inversiones
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <CheckCircle2 className="size-3" />
              CRUD Activo
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Registro de compras en Bolívares (VES), tasa BCV dinámica y cálculo de costo unitario real con flete.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="h-10 gap-1.5 md-ripple rounded-xl border-neutral-200 dark:border-neutral-800"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            onClick={() => {
              setCreateError(null);
              setOpenCreateModal(true);
            }}
            className="h-10 gap-2 font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 md-ripple md-elevation-2 rounded-xl transition-all"
          >
            <Plus className="size-4" />
            <span>Nueva Inversión</span>
          </Button>
        </div>
      </div>

      {/* Stock Replenishment Alert Banner */}
      {((summary?.low_stock_count ?? 0) > 0 || (summary?.out_of_stock_count ?? 0) > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Alerta de Inventario: Productos por Agotarse o Sin Stock
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
                Tienes{" "}
                <strong>{summary?.out_of_stock_count ?? 0} lote(s) agotados</strong> y{" "}
                <strong>{summary?.low_stock_count ?? 0} con stock mínimo</strong>. Reordena a tiempo para no perder ventas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {stockStatusFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStockStatusFilter("all")}
                className="h-8 text-xs border-amber-300 dark:border-amber-800 bg-white/80 dark:bg-neutral-900"
              >
                Ver Todos
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setStockStatusFilter("low_stock")}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
              >
                Filtrar Stock Bajo ({summary?.low_stock_count ?? 0})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Row (Material Design 3 Styling) */}
      <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Invertido USD */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Invertido (USD)
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 md-elevation-1">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              ${summary ? summary.total_invested_usd.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              ≈ {summary ? summary.total_invested_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 }) : "0.00"} VES
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>{summary ? summary.investments_count : 0} compras registradas</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              Flete: Bs. {summary ? (summary.total_shipping_ves ?? (summary.total_shipping_usd * summary.current_bcv_rate)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} (${summary ? summary.total_shipping_usd.toFixed(2) : "0.00"})
            </span>
          </div>
        </div>

        {/* 2. Total Unidades Compradas */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Unidades en Inventario
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 md-elevation-1">
              <Package className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {summary ? summary.total_items_count : 0}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              {summary?.total_sold_items !== undefined && summary.total_sold_items > 0
                ? `${summary.total_sold_items} vendidas de ${summary.total_initial_items ?? summary.total_items_count} compradas`
                : "Artículos disponibles en inventario"}
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Disponibles para venta</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Stock activo</span>
          </div>
        </div>

        {/* 3. Costo Promedio Unitario */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Costo Unitario Promedio
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 md-elevation-1">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              $
              {summary && summary.total_items_count > 0
                ? (summary.total_invested_usd / summary.total_items_count).toFixed(2)
                : "0.00"}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              Por unidad con flete prorrateado
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Costo real de adquisición</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Base de margen</span>
          </div>
        </div>

        {/* 4. Tasa BCV de Referencia */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Tasa BCV Oficial
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 md-elevation-1">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-baseline gap-1.5">
              <span>{summary ? summary.current_bcv_rate.toFixed(2) : "..."}</span>
              <span className="text-xs font-semibold text-neutral-400">VES/USD</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
              <span>API Oficial BCV en Vivo</span>
            </div>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Banco Central de Venezuela</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              Modificable
            </span>
          </div>
        </div>
      </div>

      {/* Stock Status Quick Filters */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setStockStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            stockStatusFilter === "all"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          Todos ({investments.length})
        </button>
        <button
          type="button"
          onClick={() => setStockStatusFilter("low_stock")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            stockStatusFilter === "low_stock"
              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shadow-xs font-semibold border border-amber-200 dark:border-amber-900"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span className="size-2 rounded-full bg-amber-500 inline-block" />
          Stock Bajo ({summary?.low_stock_count ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setStockStatusFilter("out_of_stock")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            stockStatusFilter === "out_of_stock"
              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 shadow-xs font-semibold border border-rose-200 dark:border-rose-900"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span className="size-2 rounded-full bg-rose-500 inline-block" />
          Agotados ({summary?.out_of_stock_count ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setStockStatusFilter("in_stock")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            stockStatusFilter === "in_stock"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold border border-emerald-200 dark:border-emerald-900"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span className="size-2 rounded-full bg-emerald-500 inline-block" />
          En Stock
        </button>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-neutral-400 shrink-0 flex items-center gap-1.5 mr-1">
          <Tag className="size-3.5" />
          Categorías:
        </span>
        <button
          onClick={() => setSelectedCategory("Todas")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            selectedCategory === "Todas"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 md-elevation-1"
              : "bg-white hover:bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800"
          }`}
        >
          Todas ({investments.length})
        </button>
        {availableCategories.map((cat) => {
          const count = investments.filter((i) => (i.category || "General").toLowerCase() === cat.toLowerCase()).length;
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 md-elevation-1"
                  : "bg-white hover:bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isSelected
                  ? "bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-800"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Bar: Search, Sort and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 md-elevation-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre de producto u observación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-neutral-50/70 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-[11px] text-neutral-400 hover:text-neutral-600 font-medium"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ordenar */}
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <ArrowUpDown className="size-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Ordenar inversiones por"
              className="h-9 text-xs rounded-xl border border-neutral-200 bg-neutral-50/70 px-2.5 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200 focus:outline-none"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
              <option value="amount_desc">Mayor monto invertido</option>
              <option value="cost_desc">Mayor costo unitario</option>
            </select>
          </div>

          {/* Toggle View Mode (Cards vs Table) */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Vista en Tarjetas Material"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Vista en Tabla"
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Card View OR Table View */}
      {filteredInvestments.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 p-12 text-center md-elevation-1">
          <Package className="size-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {searchQuery ? "No se encontraron resultados" : "No has registrado inversiones aún"}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No hay compras que coincidan con "${searchQuery}". Intenta con otro término.`
              : "Comienza registrando tu primera compra de inventario en Bolívares para calcular costos exactos."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setOpenCreateModal(true)}
              className="mt-4 h-9 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl md-ripple"
            >
              <Plus className="size-4" />
              <span>Registrar Primera Inversión</span>
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* ================= VISTA EN TARJETAS (MATERIAL DESIGN) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredInvestments.map((inv) => (
            <div
              key={inv.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800 dark:bg-neutral-900/80 overflow-hidden"
            >
              {/* Accent top stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-300 via-neutral-400 to-neutral-500 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-800 group-hover:from-blue-500 group-hover:via-emerald-500 group-hover:to-teal-500 transition-all duration-300"></div>

              <div>
                {/* Header: Product Name + Category + Date */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white line-clamp-1">
                      {inv.product_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{formatDate(inv.created_at)}</span>
                      </div>
                      <span className="text-neutral-300 dark:text-neutral-700">•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
                        <Tag className="size-3 text-neutral-400" />
                        {inv.category || "General"}
                      </span>
                    </div>
                  </div>
                  {inv.quantity <= 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Agotado (0 uds)
                    </span>
                  ) : inv.quantity <= (inv.min_stock_alert ?? 3) ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                      title={`Alerta de stock mínimo fijada en ${inv.min_stock_alert ?? 3} uds`}
                    >
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      Stock Bajo ({inv.quantity} de mín. {inv.min_stock_alert ?? 3})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      {inv.quantity} de {inv.initial_quantity || inv.quantity} uds
                    </span>
                  )}
                </div>

                {/* Primary Metric Badge: Unit Cost in USD & VES */}
                <div className="my-4 p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Costo Real / Unidad
                    </span>
                    <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                      ${inv.unit_cost_usd.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">En Bolívares</span>
                    <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Bs. {inv.unit_cost_ves.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Financial breakdown details */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-400">Inversión VES</span>
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Bs. {inv.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-400">Tasa BCV Aplicada</span>
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {inv.bcv_rate.toFixed(2)} VES/$
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-400">Flete / Envío (VES)</span>
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      Bs. {(inv.shipping_cost_ves ?? (inv.shipping_cost_usd * inv.bcv_rate)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-normal">
                      ≈ ${inv.shipping_cost_usd.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-neutral-400">Total Invertido</span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      ${inv.total_cost_usd.toFixed(2)} USD
                    </div>
                  </div>
                </div>

                {/* Notes if available */}
                {inv.notes && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1">
                    <Tag className="size-3 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 italic">{inv.notes}</span>
                  </div>
                )}
              </div>

              {/* Card Action Footer */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenReorder(inv)}
                  className="h-8 px-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg gap-1"
                  title="Reabastecer con un nuevo lote"
                >
                  <RefreshCw className="size-3 text-emerald-600" />
                  <span>Reordenar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDetail(inv)}
                  className="h-8 px-2.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg md-ripple"
                  title="Ver desglose completo"
                >
                  <Eye className="size-3.5 mr-1" />
                  <span>Detalle</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(inv)}
                  className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg md-ripple"
                  title="Editar inversión"
                >
                  <Pencil className="size-3.5 mr-1" />
                  <span>Editar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(inv)}
                  className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg md-ripple"
                  title="Eliminar inversión"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  <span>Eliminar</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= VISTA EN TABLA SHADCN ================= */
        <div className="rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 md-elevation-1 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Historial de Compras & Costos Unitarios
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Detalle de cada lote ingresado en bolívares y convertido con flete
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
              {filteredInvestments.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 dark:bg-neutral-950/50 border-b border-neutral-200/70 dark:border-neutral-800/70 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Inversión (VES)</th>
                  <th className="py-3 px-4">Tasa BCV</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Envío (VES)</th>
                  <th className="py-3 px-4">Costo Real Unitario</th>
                  <th className="py-3 px-4">Total Real ($)</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                {filteredInvestments.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                      <div className="font-semibold">{inv.product_name}</div>
                      {inv.notes && (
                        <span className="text-[11px] text-neutral-400 italic line-clamp-1">
                          {inv.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        <Tag className="size-2.5" />
                        {inv.category || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      Bs. {inv.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                      {inv.bcv_rate.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {inv.quantity <= 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                            Agotado
                          </span>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Lote: {inv.initial_quantity || inv.quantity} uds
                          </div>
                        </div>
                      ) : inv.quantity <= (inv.min_stock_alert ?? 3) ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            {inv.quantity} disp. (Bajo)
                          </span>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            mínimo {inv.min_stock_alert ?? 3} uds
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            {inv.quantity} disp.
                          </span>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            de {inv.initial_quantity || inv.quantity} uds
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      <div>Bs. {(inv.shipping_cost_ves ?? (inv.shipping_cost_usd * inv.bcv_rate)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[10px] text-neutral-400 font-normal">
                        ≈ ${inv.shipping_cost_usd.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${inv.unit_cost_usd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Bs. {inv.unit_cost_ves.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                      ${inv.total_cost_usd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenReorder(inv)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors md-ripple"
                          title="Reordenar Lote"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(inv)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors md-ripple"
                          title="Ver Detalle"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors md-ripple"
                          title="Editar Inversión"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(inv)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors md-ripple"
                          title="Eliminar Inversión"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: REGISTRAR NUEVA INVERSIÓN (CREATE) ================= */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar Nueva Inversión</DialogTitle>
            <DialogDescription>
              Ingresa el monto de la compra en Bolívares. El sistema convertirá con la tasa BCV y prorrateará el envío para determinar tu costo real.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvestment} className="space-y-4 pt-1">
            {createError && (
              <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Row 1: Nombre del Producto + Categoría + Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="product">Nombre del Producto o Lote</Label>
                <Input
                  id="product"
                  placeholder="Ej. Audífonos Bluetooth Pro (50 uds)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Categoría</Label>
                  <span className="text-[10px] text-neutral-400">Escribe o selecciona</span>
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="category"
                    list="create-categories-list"
                    placeholder="Ej. Audio, Smartphones..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="pl-8 rounded-xl font-medium"
                    required
                  />
                  <datalist id="create-categories-list">
                    {availableCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                {availableCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {availableCategories.slice(0, 4).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                          category.toLowerCase() === c.toLowerCase()
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Observaciones (Opcional)</Label>
                <Input
                  id="notes"
                  placeholder="Proveedor, factura, número de guía..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Row 2: 5 Inputs Financieros e Inventario alineados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Monto Invertido en Bolívares */}
              <div className="space-y-1.5">
                <Label htmlFor="amountVes">Inversión (VES)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Bs.
                  </span>
                  <Input
                    id="amountVes"
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    className="pl-9 font-semibold rounded-xl"
                    value={amountVes}
                    onChange={(e) => setAmountVes(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tasa BCV (Modificable) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bcvRate">Tasa BCV</Label>
                  <span className="text-[10px] text-emerald-600 font-extrabold uppercase">
                    Editable
                  </span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="bcvRate"
                    type="number"
                    step="0.01"
                    placeholder="75.50"
                    className="pl-8 font-semibold rounded-xl"
                    value={bcvRate}
                    onChange={(e) => setBcvRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Cantidad Comprada */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad (Uds)</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="10"
                    className="pl-8 font-semibold rounded-xl"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Alerta Stock Mínimo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="minStockAlert">Alerta Stock Mín.</Label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Uds</span>
                </div>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="minStockAlert"
                    type="number"
                    min="0"
                    placeholder="3"
                    className="pl-8 font-semibold rounded-xl"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                  />
                </div>
              </div>

              {/* Costo de Envío en Bolívares (VES) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shippingVes">Envío (VES)</Label>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    ≈ ${liveShippingUsd.toFixed(2)} USD
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Bs.
                  </span>
                  <Input
                    id="shippingVes"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 font-semibold rounded-xl"
                    value={shippingCostVes}
                    onChange={(e) => setShippingCostVes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-2 md-elevation-1">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <Calculator className="size-3.5 text-blue-600" />
                  <span>Cálculo Automático en Vivo</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                  Recálculo instantáneo
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Compra USD</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                    ${liveAmountUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {numAmountVes.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">+ Flete (VES)</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                    Bs. {numShippingVes.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    ≈ ${liveShippingUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                    Costo / Ud ($)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    ${liveUnitUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 font-medium mt-0.5">
                    Total: ${liveTotalUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold">
                    Costo / Ud (VES)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Bs. {liveUnitVes.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-blue-600/80 font-medium mt-0.5">
                    Total: Bs. {liveTotalVes.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateModal(false)}
                disabled={submittingCreate}
                className="rounded-xl md-ripple"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingCreate}
                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl md-ripple font-medium"
              >
                {submittingCreate ? "Guardando..." : "Guardar Inversión"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 2: EDITAR INVERSIÓN (UPDATE) ================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Inversión</DialogTitle>
            <DialogDescription>
              Modifica los datos del lote. El sistema recalculará los costos unitarios en USD y Bolívares.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateInvestment} className="space-y-4 pt-1">
            {editError && (
              <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Row 1: Nombre del Producto + Categoría + Observaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editProduct">Nombre del Producto / Lote</Label>
                <Input
                  id="editProduct"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editCategory">Categoría</Label>
                  <span className="text-[10px] text-neutral-400">Escribe o selecciona</span>
                </div>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editCategory"
                    list="edit-categories-list"
                    placeholder="Ej. Audio, Smartphones..."
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="pl-8 rounded-xl font-medium"
                    required
                  />
                  <datalist id="edit-categories-list">
                    {availableCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                {availableCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {availableCategories.slice(0, 4).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEditCategory(c)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                          editCategory.toLowerCase() === c.toLowerCase()
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editNotes">Observaciones</Label>
                <Input
                  id="editNotes"
                  placeholder="Proveedor, factura, notas..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Row 2: 5 Inputs Financieros e Inventario alineados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Monto Invertido en Bolívares */}
              <div className="space-y-1.5">
                <Label htmlFor="editAmountVes">Inversión (VES)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Bs.
                  </span>
                  <Input
                    id="editAmountVes"
                    type="number"
                    step="0.01"
                    className="pl-9 font-semibold rounded-xl"
                    value={editAmountVes}
                    onChange={(e) => setEditAmountVes(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tasa BCV */}
              <div className="space-y-1.5">
                <Label htmlFor="editBcvRate">Tasa BCV Aplicada</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editBcvRate"
                    type="number"
                    step="0.01"
                    className="pl-8 font-semibold rounded-xl"
                    value={editBcvRate}
                    onChange={(e) => setEditBcvRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Cantidad Comprada / Lote Total */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editQuantity">Lote Total (Uds)</Label>
                  {editingItem && (editingItem.initial_quantity || editingItem.quantity) > editingItem.quantity && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold" title="Unidades ya vendidas en este lote">
                      Vendidas: {(editingItem.initial_quantity || editingItem.quantity) - editingItem.quantity}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editQuantity"
                    type="number"
                    min={Math.max(1, (editingItem ? ((editingItem.initial_quantity || editingItem.quantity) - editingItem.quantity) : 1))}
                    className="pl-8 font-semibold rounded-xl"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Alerta Stock Mínimo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editMinStockAlert">Alerta Stock Mín.</Label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Uds</span>
                </div>
                <div className="relative">
                  <AlertTriangle className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editMinStockAlert"
                    type="number"
                    min="0"
                    placeholder="3"
                    className="pl-8 font-semibold rounded-xl"
                    value={editMinStockAlert}
                    onChange={(e) => setEditMinStockAlert(e.target.value)}
                  />
                </div>
              </div>

              {/* Costo de Envío en Bolívares (VES) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editShippingVes">Envío (VES)</Label>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    ≈ ${editLiveShippingUsd.toFixed(2)} USD
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                    Bs.
                  </span>
                  <Input
                    id="editShippingVes"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9 font-semibold rounded-xl"
                    value={editShippingCostVes}
                    onChange={(e) => setEditShippingCostVes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Recalculation Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-2 md-elevation-1">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <Calculator className="size-3.5 text-blue-600" />
                  <span>Nuevo Costo Recalculado:</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">En vivo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Subtotal USD</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                    ${editLiveAmountUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {editNumAmountVes.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">+ Flete (VES)</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white">
                    Bs. {editNumShippingVes.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    ≈ ${editLiveShippingUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                    Costo / Ud ($)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                    ${editLiveUnitUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600/80 font-medium mt-0.5">
                    Total: ${editLiveTotalUsd.toFixed(2)}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 shadow-2xs">
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold">
                    Costo / Ud (VES)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    Bs. {editLiveUnitVes.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-blue-600/80 font-medium mt-0.5">
                    Total: Bs. {editLiveTotalVes.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditModal(false)}
                disabled={submittingEdit}
                className="rounded-xl md-ripple"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingEdit}
                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl md-ripple font-medium"
              >
                {submittingEdit ? "Guardando Cambios..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 3: DETALLE DE INVERSIÓN (READ DETAIL) ================= */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-neutral-600" />
              <span>Detalle de Inversión</span>
            </DialogTitle>
            <DialogDescription>
              Ficha técnica y desglose financiero de la compra.
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-semibold uppercase">Producto / Lote</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200/70 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                    <Tag className="size-3 text-neutral-500 dark:text-neutral-400" />
                    {detailItem.category || "General"}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                  {detailItem.product_name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <Calendar className="size-3.5" />
                  <span>Registrado el {formatDate(detailItem.created_at)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Costo Unitario USD</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${detailItem.unit_cost_usd.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Costo Unitario VES</span>
                  <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    Bs. {detailItem.unit_cost_ves.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Monto Invertido (VES):</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Bs. {detailItem.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Tasa de Cambio BCV:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {detailItem.bcv_rate.toFixed(2)} VES/USD
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Subtotal Compra (USD):</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    ${detailItem.amount_usd.toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Costo de Flete / Envío:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Bs. {(detailItem.shipping_cost_ves ?? (detailItem.shipping_cost_usd * detailItem.bcv_rate)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-normal text-neutral-400 text-[11px]">(${detailItem.shipping_cost_usd.toFixed(2)} USD)</span>
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Stock Disponible:</span>
                  <span className={`font-bold ${detailItem.quantity <= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {detailItem.quantity <= 0 ? "Agotado (0 uds)" : `${detailItem.quantity} unidades`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Tamaño del Lote Inicial:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {detailItem.initial_quantity || detailItem.quantity} uds
                  </span>
                </div>
                {((detailItem.initial_quantity || detailItem.quantity) - detailItem.quantity) > 0 && (
                  <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                    <span className="text-neutral-500">Unidades Vendidas:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {(detailItem.initial_quantity || detailItem.quantity) - detailItem.quantity} uds
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-neutral-700 dark:text-neutral-300 font-bold">Total Desembolsado:</span>
                  <span className="font-extrabold text-neutral-900 dark:text-white text-sm">
                    ${detailItem.total_cost_usd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {detailItem.notes && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Observaciones:</span>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">{detailItem.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setOpenDetailModal(false)}
              className="rounded-xl w-full sm:w-auto md-ripple"
            >
              Cerrar
            </Button>
            {detailItem && (
              <Button
                onClick={() => {
                  setOpenDetailModal(false);
                  handleOpenEdit(detailItem);
                }}
                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl w-full sm:w-auto md-ripple"
              >
                <Pencil className="size-3.5 mr-1.5" />
                Editar Lote
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 4: CONFIRMAR ELIMINACIÓN (DELETE) ================= */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-2 md-elevation-1">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-center">¿Eliminar esta Inversión?</DialogTitle>
            <DialogDescription className="text-center">
              Esta acción no se puede deshacer. Se eliminará el registro de inventario y se recalcularán los acumulados financieros.
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1">
              <div className="font-bold text-neutral-900 dark:text-white">
                {itemToDelete.product_name}
              </div>
              <div className="text-neutral-500">
                Monto: Bs. {itemToDelete.amount_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })} (${itemToDelete.total_cost_usd.toFixed(2)} USD)
              </div>
              <div className="text-neutral-400 text-[11px]">
                {itemToDelete.quantity} unidades compradas
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenDeleteModal(false);
                setItemToDelete(null);
              }}
              disabled={deleting}
              className="rounded-xl md-ripple"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl md-ripple font-medium"
            >
              {deleting ? "Eliminando..." : "Sí, Eliminar Inversión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 5: REORDEN DE INVENTARIO / REABASTECIMIENTO ================= */}
      <Dialog open={openReorderModal} onOpenChange={setOpenReorderModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <RefreshCw className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Reordenar / Reabastecer Inventario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo lote para este producto manteniendo su categoría y calculando costos a la tasa actual.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {reorderItem && (
            <form onSubmit={handleConfirmReorder} className="space-y-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500 font-medium">Producto a Reordenar:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-800 font-semibold">
                    {reorderItem.category || "General"}
                  </span>
                </div>
                <div className="text-base font-bold text-neutral-900 dark:text-white">
                  {reorderItem.product_name}
                </div>
                <div className="text-xs text-neutral-500 flex items-center justify-between pt-1">
                  <span>Costo unitario anterior: <strong>${reorderItem.unit_cost_usd.toFixed(2)} USD</strong></span>
                  <span>Stock actual: <strong className={reorderItem.quantity <= 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}>{reorderItem.quantity} uds</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reorderQuantity">Cantidad a Pedir (Uds)</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                    <Input
                      id="reorderQuantity"
                      type="number"
                      min="1"
                      className="pl-8 font-semibold rounded-xl"
                      value={reorderQuantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReorderQuantity(val);
                        const q = parseInt(val) || 0;
                        const rate = parseFloat(reorderBcvRate) || summary?.current_bcv_rate || 1;
                        const estUsd = q * reorderItem.unit_cost_usd;
                        setReorderAmountVes((estUsd * rate).toFixed(2));
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reorderMinStock">Alerta Stock Mínimo</Label>
                  <div className="relative">
                    <AlertTriangle className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                    <Input
                      id="reorderMinStock"
                      type="number"
                      min="0"
                      className="pl-8 font-semibold rounded-xl"
                      value={reorderMinStock}
                      onChange={(e) => setReorderMinStock(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reorderBcvRate">Tasa BCV Aplicada</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                    <Input
                      id="reorderBcvRate"
                      type="number"
                      step="0.01"
                      className="pl-8 font-semibold rounded-xl"
                      value={reorderBcvRate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReorderBcvRate(val);
                        const rate = parseFloat(val) || 1;
                        const q = parseInt(reorderQuantity) || 0;
                        const estUsd = q * reorderItem.unit_cost_usd;
                        setReorderAmountVes((estUsd * rate).toFixed(2));
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reorderAmountVes">Inversión Estimada (VES)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">Bs.</span>
                    <Input
                      id="reorderAmountVes"
                      type="number"
                      step="0.01"
                      className="pl-9 font-semibold rounded-xl"
                      value={reorderAmountVes}
                      onChange={(e) => setReorderAmountVes(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reorderShippingVes">Flete / Envío (VES)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">Bs.</span>
                    <Input
                      id="reorderShippingVes"
                      type="number"
                      step="0.01"
                      className="pl-9 font-semibold rounded-xl"
                      value={reorderShippingVes}
                      onChange={(e) => setReorderShippingVes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reorderNotes">Notas de la Orden</Label>
                  <Input
                    id="reorderNotes"
                    placeholder="Proveedor, factura..."
                    className="rounded-xl"
                    value={reorderNotes}
                    onChange={(e) => setReorderNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpenReorderModal(false);
                    setReorderItem(null);
                  }}
                  disabled={submittingReorder}
                  className="rounded-xl md-ripple"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReorder}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl md-ripple font-medium gap-1.5"
                >
                  {submittingReorder ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Reabasteciendo...
                    </>
                  ) : (
                    <>
                      <Package className="size-3.5" />
                      Confirmar Reorden ({reorderQuantity} uds)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
