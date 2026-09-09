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
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Trash2,
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
  User,
  CreditCard,
  Percent,
  Wallet,
  Coins,
  Receipt,
  Sparkles,
  Layers,
  Calculator,
  Info,
} from "lucide-react";

interface Investment {
  id: string;
  product_name: string;
  amount_ves: number;
  bcv_rate: number;
  amount_usd: number;
  quantity: number;
  initial_quantity?: number;
  shipping_cost_ves: number;
  shipping_cost_usd: number;
  total_cost_usd: number;
  unit_cost_usd: number;
  unit_cost_ves: number;
  notes?: string;
  created_at: string;
}

interface Sale {
  id: string;
  user_id: string;
  investment_id?: string;
  product_name: string;
  quantity: number;
  unit_cost_usd: number;
  unit_price_usd: number;
  unit_price_ves: number;
  bcv_rate: number;
  total_income_usd: number;
  total_income_ves: number;
  total_cost_usd: number;
  total_cost_ves: number;
  net_profit_usd: number;
  net_profit_ves: number;
  profit_margin_percent: number;
  payment_method: string;
  customer_name?: string;
  notes?: string;
  created_at: string;
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

const PAYMENT_METHODS = [
  "Pago Móvil",
  "Efectivo USD",
  "Efectivo VES",
  "Zelle",
  "Punto de Venta",
  "Transferencia VES",
  "Binance / USDT",
  "Otro",
];

export default function VentasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<SaleSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "profit_desc" | "income_desc">("date_desc");

  // Create Modal State
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [bcvRate, setBcvRate] = useState("75.50");
  const [unitCostUsd, setUnitCostUsd] = useState("0.00");
  const [unitCostVes, setUnitCostVes] = useState("0.00");
  
  // Price entry mode: "total" (cobré X por las N unidades) vs "unit" (cobré X por cada unidad)
  const [priceMode, setPriceMode] = useState<"total" | "unit">("total");
  const [totalIncomeInputVes, setTotalIncomeInputVes] = useState("");
  const [totalIncomeInputUsd, setTotalIncomeInputUsd] = useState("");
  const [unitPriceInputVes, setUnitPriceInputVes] = useState("");
  const [unitPriceInputUsd, setUnitPriceInputUsd] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Pago Móvil");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [openEditModal, setOpenEditModal] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<Sale | null>(null);
  const [editInvestmentId, setEditInvestmentId] = useState<string>("");
  const [editProductName, setEditProductName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editBcvRate, setEditBcvRate] = useState("");
  const [editUnitCostUsd, setEditUnitCostUsd] = useState("");
  const [editUnitCostVes, setEditUnitCostVes] = useState("");
  
  const [editPriceMode, setEditPriceMode] = useState<"total" | "unit">("total");
  const [editTotalIncomeInputVes, setEditTotalIncomeInputVes] = useState("");
  const [editTotalIncomeInputUsd, setEditTotalIncomeInputUsd] = useState("");
  const [editUnitPriceInputVes, setEditUnitPriceInputVes] = useState("");
  const [editUnitPriceInputUsd, setEditUnitPriceInputUsd] = useState("");

  const [editPaymentMethod, setEditPaymentMethod] = useState("Pago Móvil");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Detail Modal
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<Sale | null>(null);

  // Delete Modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  // =================== CALCULATIONS FOR CREATE ===================
  const numBcvRate = parseFloat(bcvRate) || 1;
  const numQuantity = Math.max(1, parseInt(quantity) || 1);
  const numUnitCostUsd = parseFloat(unitCostUsd) || 0;
  const numUnitCostVes = parseFloat(unitCostVes) > 0 ? parseFloat(unitCostVes) : numUnitCostUsd * numBcvRate;

  // Determine computed prices based on priceMode
  const computedUnitPriceUsd = useMemo(() => {
    if (priceMode === "total") {
      const totUsd = parseFloat(totalIncomeInputUsd) || 0;
      return numQuantity > 0 ? totUsd / numQuantity : 0;
    } else {
      return parseFloat(unitPriceInputUsd) || 0;
    }
  }, [priceMode, totalIncomeInputUsd, unitPriceInputUsd, numQuantity]);

  const computedUnitPriceVes = useMemo(() => {
    if (priceMode === "total") {
      const totVes = parseFloat(totalIncomeInputVes) || 0;
      return numQuantity > 0 ? totVes / numQuantity : 0;
    } else {
      return parseFloat(unitPriceInputVes) || 0;
    }
  }, [priceMode, totalIncomeInputVes, unitPriceInputVes, numQuantity]);

  const computedTotalIncomeUsd = useMemo(() => {
    if (priceMode === "total") {
      return parseFloat(totalIncomeInputUsd) || 0;
    } else {
      return (parseFloat(unitPriceInputUsd) || 0) * numQuantity;
    }
  }, [priceMode, totalIncomeInputUsd, unitPriceInputUsd, numQuantity]);

  const computedTotalIncomeVes = useMemo(() => {
    if (priceMode === "total") {
      return parseFloat(totalIncomeInputVes) || 0;
    } else {
      return (parseFloat(unitPriceInputVes) || 0) * numQuantity;
    }
  }, [priceMode, totalIncomeInputVes, unitPriceInputVes, numQuantity]);

  const computedTotalCostUsd = numUnitCostUsd * numQuantity;
  const computedTotalCostVes = numUnitCostVes * numQuantity;
  const computedNetProfitUsd = computedTotalIncomeUsd - computedTotalCostUsd;
  const computedNetProfitVes = computedTotalIncomeVes - computedTotalCostVes;
  const computedMarginPercent = computedTotalCostUsd > 0 ? (computedNetProfitUsd / computedTotalCostUsd) * 100 : 100;

  // Selected investment details for Create
  const selectedLot = useMemo(() => {
    return investments.find((i) => i.id === selectedInvestmentId) || null;
  }, [investments, selectedInvestmentId]);

  // =================== CALCULATIONS FOR EDIT ===================
  const editNumBcvRate = parseFloat(editBcvRate) || 1;
  const editNumQuantity = Math.max(1, parseInt(editQuantity) || 1);
  const editNumUnitCostUsd = parseFloat(editUnitCostUsd) || 0;
  const editNumUnitCostVes = parseFloat(editUnitCostVes) > 0 ? parseFloat(editUnitCostVes) : editNumUnitCostUsd * editNumBcvRate;

  const editComputedUnitPriceUsd = useMemo(() => {
    if (editPriceMode === "total") {
      const totUsd = parseFloat(editTotalIncomeInputUsd) || 0;
      return editNumQuantity > 0 ? totUsd / editNumQuantity : 0;
    } else {
      return parseFloat(editUnitPriceInputUsd) || 0;
    }
  }, [editPriceMode, editTotalIncomeInputUsd, editUnitPriceInputUsd, editNumQuantity]);

  const editComputedUnitPriceVes = useMemo(() => {
    if (editPriceMode === "total") {
      const totVes = parseFloat(editTotalIncomeInputVes) || 0;
      return editNumQuantity > 0 ? totVes / editNumQuantity : 0;
    } else {
      return parseFloat(editUnitPriceInputVes) || 0;
    }
  }, [editPriceMode, editTotalIncomeInputVes, editUnitPriceInputVes, editNumQuantity]);

  const editComputedTotalIncomeUsd = useMemo(() => {
    if (editPriceMode === "total") {
      return parseFloat(editTotalIncomeInputUsd) || 0;
    } else {
      return (parseFloat(editUnitPriceInputUsd) || 0) * editNumQuantity;
    }
  }, [editPriceMode, editTotalIncomeInputUsd, editUnitPriceInputUsd, editNumQuantity]);

  const editComputedTotalIncomeVes = useMemo(() => {
    if (editPriceMode === "total") {
      return parseFloat(editTotalIncomeInputVes) || 0;
    } else {
      return (parseFloat(editUnitPriceInputVes) || 0) * editNumQuantity;
    }
  }, [editPriceMode, editTotalIncomeInputVes, editUnitPriceInputVes, editNumQuantity]);

  const editComputedTotalCostUsd = editNumUnitCostUsd * editNumQuantity;
  const editComputedTotalCostVes = editNumUnitCostVes * editNumQuantity;
  const editComputedNetProfitUsd = editComputedTotalIncomeUsd - editComputedTotalCostUsd;
  const editComputedNetProfitVes = editComputedTotalIncomeVes - editComputedTotalCostVes;
  const editComputedMarginPercent = editComputedTotalCostUsd > 0 ? (editComputedNetProfitUsd / editComputedTotalCostUsd) * 100 : 100;

  const editSelectedLot = useMemo(() => {
    return investments.find((i) => i.id === editInvestmentId) || null;
  }, [investments, editInvestmentId]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, sumData, invData] = await Promise.all([
        apiFetch<Sale[]>("/sales/"),
        apiFetch<SaleSummary>("/sales/summary"),
        apiFetch<Investment[]>("/investments/"),
      ]);
      setSales(salesData);
      setSummary(sumData);
      setInvestments(invData);
      if (sumData.current_bcv_rate) {
        setBcvRate(sumData.current_bcv_rate.toString());
      }
    } catch (err: any) {
      console.error("Error al cargar ventas:", err);
      notify.error("Error al sincronizar datos", err.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Synchronizers for Create inputs
  const handleTotalVesChange = (val: string) => {
    setTotalIncomeInputVes(val);
    const num = parseFloat(val);
    if (!isNaN(num) && numBcvRate > 0) {
      setTotalIncomeInputUsd((num / numBcvRate).toFixed(2));
      if (numQuantity > 0) {
        setUnitPriceInputVes((num / numQuantity).toFixed(2));
        setUnitPriceInputUsd((num / numBcvRate / numQuantity).toFixed(2));
      }
    } else {
      setTotalIncomeInputUsd("");
      setUnitPriceInputVes("");
      setUnitPriceInputUsd("");
    }
  };

  const handleTotalUsdChange = (val: string) => {
    setTotalIncomeInputUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && numBcvRate > 0) {
      setTotalIncomeInputVes((num * numBcvRate).toFixed(2));
      if (numQuantity > 0) {
        setUnitPriceInputUsd((num / numQuantity).toFixed(2));
        setUnitPriceInputVes((num * numBcvRate / numQuantity).toFixed(2));
      }
    } else {
      setTotalIncomeInputVes("");
      setUnitPriceInputVes("");
      setUnitPriceInputUsd("");
    }
  };

  const handleUnitVesChange = (val: string) => {
    setUnitPriceInputVes(val);
    const num = parseFloat(val);
    if (!isNaN(num) && numBcvRate > 0) {
      setUnitPriceInputUsd((num / numBcvRate).toFixed(2));
      setTotalIncomeInputVes((num * numQuantity).toFixed(2));
      setTotalIncomeInputUsd(((num * numQuantity) / numBcvRate).toFixed(2));
    } else {
      setUnitPriceInputUsd("");
      setTotalIncomeInputVes("");
      setTotalIncomeInputUsd("");
    }
  };

  const handleUnitUsdChange = (val: string) => {
    setUnitPriceInputUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && numBcvRate > 0) {
      setUnitPriceInputVes((num * numBcvRate).toFixed(2));
      setTotalIncomeInputUsd((num * numQuantity).toFixed(2));
      setTotalIncomeInputVes((num * numQuantity * numBcvRate).toFixed(2));
    } else {
      setUnitPriceInputVes("");
      setTotalIncomeInputUsd("");
      setTotalIncomeInputVes("");
    }
  };

  // Synchronizers for Edit inputs
  const handleEditTotalVesChange = (val: string) => {
    setEditTotalIncomeInputVes(val);
    const num = parseFloat(val);
    if (!isNaN(num) && editNumBcvRate > 0) {
      setEditTotalIncomeInputUsd((num / editNumBcvRate).toFixed(2));
      if (editNumQuantity > 0) {
        setEditUnitPriceInputVes((num / editNumQuantity).toFixed(2));
        setEditUnitPriceInputUsd((num / editNumBcvRate / editNumQuantity).toFixed(2));
      }
    } else {
      setEditTotalIncomeInputUsd("");
      setEditUnitPriceInputVes("");
      setEditUnitPriceInputUsd("");
    }
  };

  const handleEditTotalUsdChange = (val: string) => {
    setEditTotalIncomeInputUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && editNumBcvRate > 0) {
      setEditTotalIncomeInputVes((num * editNumBcvRate).toFixed(2));
      if (editNumQuantity > 0) {
        setEditUnitPriceInputUsd((num / editNumQuantity).toFixed(2));
        setEditUnitPriceInputVes((num * editNumBcvRate / editNumQuantity).toFixed(2));
      }
    } else {
      setEditTotalIncomeInputVes("");
      setEditUnitPriceInputVes("");
      setEditUnitPriceInputUsd("");
    }
  };

  const handleEditUnitVesChange = (val: string) => {
    setEditUnitPriceInputVes(val);
    const num = parseFloat(val);
    if (!isNaN(num) && editNumBcvRate > 0) {
      setEditUnitPriceInputUsd((num / editNumBcvRate).toFixed(2));
      setEditTotalIncomeInputVes((num * editNumQuantity).toFixed(2));
      setEditTotalIncomeInputUsd(((num * editNumQuantity) / editNumBcvRate).toFixed(2));
    } else {
      setEditUnitPriceInputUsd("");
      setEditTotalIncomeInputVes("");
      setEditTotalIncomeInputUsd("");
    }
  };

  const handleEditUnitUsdChange = (val: string) => {
    setEditUnitPriceInputUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && editNumBcvRate > 0) {
      setEditUnitPriceInputVes((num * editNumBcvRate).toFixed(2));
      setEditTotalIncomeInputUsd((num * editNumQuantity).toFixed(2));
      setEditTotalIncomeInputVes((num * editNumQuantity * editNumBcvRate).toFixed(2));
    } else {
      setEditUnitPriceInputVes("");
      setEditTotalIncomeInputUsd("");
      setEditTotalIncomeInputVes("");
    }
  };

  // Lot selection handler for Create
  const handleLotSelect = (invId: string) => {
    setSelectedInvestmentId(invId);
    if (!invId) {
      setProductName("");
      setUnitCostUsd("0.00");
      setUnitCostVes("0.00");
      return;
    }
    const inv = investments.find((i) => i.id === invId);
    if (inv) {
      setProductName(inv.product_name);
      setUnitCostUsd(inv.unit_cost_usd.toString());
      setUnitCostVes((inv.unit_cost_ves || inv.unit_cost_usd * numBcvRate).toFixed(2));
    }
  };

  // Lot selection handler for Edit
  const handleEditLotSelect = (invId: string) => {
    setEditInvestmentId(invId);
    if (!invId) {
      return;
    }
    const inv = investments.find((i) => i.id === invId);
    if (inv) {
      setEditProductName(inv.product_name);
      setEditUnitCostUsd(inv.unit_cost_usd.toString());
      setEditUnitCostVes((inv.unit_cost_ves || inv.unit_cost_usd * editNumBcvRate).toFixed(2));
    }
  };

  // CRUD: CREATE
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!productName.trim()) {
      setCreateError("Ingresa el nombre del producto vendido");
      notify.warning("Campo requerido", "Debes ingresar un nombre de producto.");
      return;
    }
    if (numQuantity <= 0) {
      setCreateError("La cantidad debe ser mayor a 0");
      return;
    }
    if (selectedLot && numQuantity > selectedLot.quantity) {
      setCreateError(`Stock insuficiente en "${selectedLot.product_name}". Disponibles en inventario: ${selectedLot.quantity} uds.`);
      notify.warning("Stock insuficiente", `Solo dispones de ${selectedLot.quantity} unidades en inventario.`);
      return;
    }
    if (computedUnitPriceUsd <= 0 && computedUnitPriceVes <= 0) {
      setCreateError("Debes especificar un monto cobrado o precio de venta mayor a 0");
      notify.warning("Monto requerido", "Ingresa el monto cobrado de la venta.");
      return;
    }

    setSubmittingCreate(true);
    try {
      const created = await apiFetch<Sale>("/sales/", {
        method: "POST",
        body: JSON.stringify({
          investment_id: selectedInvestmentId || undefined,
          product_name: productName.trim(),
          quantity: numQuantity,
          bcv_rate: numBcvRate,
          unit_cost_usd: numUnitCostUsd,
          unit_price_usd: computedUnitPriceUsd,
          unit_price_ves: computedUnitPriceVes,
          payment_method: paymentMethod,
          customer_name: customerName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      notify.success("Venta registrada", `Venta de "${created.product_name}" guardada con éxito.`);

      // Reset
      setSelectedInvestmentId("");
      setProductName("");
      setQuantity("1");
      setTotalIncomeInputVes("");
      setTotalIncomeInputUsd("");
      setUnitPriceInputVes("");
      setUnitPriceInputUsd("");
      setCustomerName("");
      setNotes("");
      setOpenCreateModal(false);
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || "Error al registrar la venta");
      notify.error("Error al registrar venta", err.message || "Revisa los campos e intenta nuevamente.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // CRUD: OPEN EDIT
  const handleOpenEdit = (sale: Sale) => {
    setEditingItem(sale);
    setEditInvestmentId(sale.investment_id || "");
    setEditProductName(sale.product_name);
    setEditQuantity(sale.quantity.toString());
    setEditBcvRate(sale.bcv_rate.toString());
    setEditUnitCostUsd(sale.unit_cost_usd.toString());
    setEditUnitCostVes((sale.unit_cost_usd * sale.bcv_rate).toFixed(2));
    
    // Default edit price mode to "total" for maximum clarity
    setEditPriceMode("total");
    setEditTotalIncomeInputUsd(sale.total_income_usd.toFixed(2));
    setEditTotalIncomeInputVes(sale.total_income_ves.toFixed(2));
    setEditUnitPriceInputUsd(sale.unit_price_usd.toFixed(2));
    setEditUnitPriceInputVes(sale.unit_price_ves.toFixed(2));

    setEditPaymentMethod(sale.payment_method);
    setEditCustomerName(sale.customer_name || "");
    setEditNotes(sale.notes || "");
    setEditError(null);
    setOpenEditModal(true);
  };

  // CRUD: UPDATE
  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editProductName.trim()) {
      setEditError("El nombre del producto no puede estar vacío");
      return;
    }
    if (editNumQuantity <= 0) {
      setEditError("La cantidad debe ser mayor a 0");
      return;
    }
    if (editSelectedLot) {
      const isSameLot = editingItem.investment_id === editInvestmentId;
      const effectiveStock = isSameLot ? editSelectedLot.quantity + editingItem.quantity : editSelectedLot.quantity;
      if (editNumQuantity > effectiveStock) {
        setEditError(`Stock insuficiente en "${editSelectedLot.product_name}". Disponibles: ${effectiveStock} uds.`);
        notify.warning("Stock insuficiente", `Solo dispones de ${effectiveStock} unidades en inventario para esta venta.`);
        return;
      }
    }
    if (editComputedUnitPriceUsd <= 0 && editComputedUnitPriceVes <= 0) {
      setEditError("Debes especificar un monto cobrado o precio de venta mayor a 0");
      return;
    }

    setSubmittingEdit(true);
    setEditError(null);

    try {
      await apiFetch<Sale>(`/sales/${editingItem.id}`, {
        method: "PUT",
        body: JSON.stringify({
          investment_id: editInvestmentId || undefined,
          product_name: editProductName.trim(),
          quantity: editNumQuantity,
          bcv_rate: editNumBcvRate,
          unit_cost_usd: editNumUnitCostUsd,
          unit_price_usd: editComputedUnitPriceUsd,
          unit_price_ves: editComputedUnitPriceVes,
          payment_method: editPaymentMethod,
          customer_name: editCustomerName.trim() || undefined,
          notes: editNotes.trim() || undefined,
        }),
      });

      notify.success("Venta actualizada", `"${editProductName}" actualizada con recálculo de ganancia.`);
      setOpenEditModal(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || "Error al actualizar la venta");
      notify.error("Error al actualizar", err.message || "No se pudo guardar la modificación.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // CRUD: DELETE
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);

    try {
      await apiFetch(`/sales/${itemToDelete.id}`, {
        method: "DELETE",
      });

      notify.success("Venta eliminada", `Registro de venta eliminado.`);
      setOpenDeleteModal(false);
      setItemToDelete(null);
      await loadData();
    } catch (err: any) {
      notify.error("Error al eliminar", err.message || "No se pudo eliminar el registro.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered & Sorted Sales
  const filteredSales = useMemo(() => {
    let result = sales.filter((s) => {
      const matchProduct = s.product_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCustomer = s.customer_name ? s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const matchNotes = s.notes ? s.notes.toLowerCase().includes(searchQuery.toLowerCase()) : false;
      const matchMethod = selectedPaymentFilter === "ALL" || s.payment_method === selectedPaymentFilter;
      return (matchProduct || matchCustomer || matchNotes) && matchMethod;
    });

    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "profit_desc") {
        return b.net_profit_usd - a.net_profit_usd;
      }
      if (sortBy === "income_desc") {
        return b.total_income_usd - a.total_income_usd;
      }
      return 0;
    });

    return result;
  }, [sales, searchQuery, selectedPaymentFilter, sortBy]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Módulo de Ventas & Ganancia
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
              <Sparkles className="size-3" />
              Rentabilidad en Vivo
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Registro de ventas por unidad o total cobrado, vinculación con lotes de inventario y desglose de ganancia neta.
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
            <span>Nueva Venta</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Facturado */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Facturado (Ingresos)
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 md-elevation-1">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              ${summary ? summary.total_income_usd.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              ≈ {summary ? summary.total_income_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 }) : "0.00"} VES
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>{summary ? summary.sales_count : 0} ventas registradas</span>
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
              Costo: ${summary ? summary.total_cost_usd.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        {/* 2. Ganancia Neta Real */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/20 p-5 md-elevation-1 md-card-interactive dark:border-emerald-800/80 dark:bg-neutral-900/80 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-emerald-900/5 dark:stroke-emerald-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Ganancia Neta Real
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 md-elevation-1">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
              +${summary ? summary.total_profit_usd.toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              +Bs. {summary ? summary.total_profit_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 }) : "0.00"} VES
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 pt-2.5 border-t border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
            <span>Beneficio neto limpio</span>
            <span className="font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
              Margen {summary ? summary.average_margin_percent.toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>

        {/* 3. Margen Promedio */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Margen de Rentabilidad
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 md-elevation-1">
              <Percent className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {summary ? summary.average_margin_percent.toFixed(2) : "0.00"}%
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              Retorno sobre costo de compra
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Rendimiento comercial</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">Eficiencia</span>
          </div>
        </div>

        {/* 4. Unidades Vendidas */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800/80 dark:bg-neutral-900/70 flex flex-col justify-between">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Unidades Vendidas
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 md-elevation-1">
              <Package className="size-4" />
            </div>
          </div>
          <div className="relative z-10 my-3">
            <div className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {summary ? summary.total_items_sold : 0}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              Artículos despachados
            </p>
          </div>
          <div className="relative z-10 text-[11px] text-neutral-500 dark:text-neutral-400 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span>Tasa BCV: {summary ? summary.current_bcv_rate.toFixed(2) : "..."}</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Salidas</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900/60 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 md-elevation-1">
        <div className="flex flex-1 items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
            <Input
              placeholder="Buscar por producto, cliente u observación..."
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

          <select
            value={selectedPaymentFilter}
            onChange={(e) => setSelectedPaymentFilter(e.target.value)}
            aria-label="Filtrar por método de pago"
            className="h-9 text-xs rounded-xl border border-neutral-200 bg-neutral-50/70 px-2.5 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200 focus:outline-none"
          >
            <option value="ALL">Todos los métodos</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <ArrowUpDown className="size-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Ordenar ventas por"
              className="h-9 text-xs rounded-xl border border-neutral-200 bg-neutral-50/70 px-2.5 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200 focus:outline-none"
            >
              <option value="date_desc">Más recientes primero</option>
              <option value="date_asc">Más antiguos primero</option>
              <option value="profit_desc">Mayor ganancia neta</option>
              <option value="income_desc">Mayor monto facturado</option>
            </select>
          </div>

          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
              title="Vista en Tarjetas"
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

      {/* Main Content */}
      {filteredSales.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 p-12 text-center md-elevation-1">
          <ShoppingCart className="size-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            {searchQuery || selectedPaymentFilter !== "ALL"
              ? "No se encontraron ventas con estos filtros"
              : "No has registrado ventas todavía"}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedPaymentFilter !== "ALL"
              ? "Intenta modificar el término de búsqueda o el método de pago seleccionado."
              : "Registra tu primera venta para calcular tu ganancia neta y margen en tiempo real."}
          </p>
          {!searchQuery && selectedPaymentFilter === "ALL" && (
            <Button
              onClick={() => setOpenCreateModal(true)}
              className="mt-4 h-9 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl md-ripple"
            >
              <Plus className="size-4" />
              <span>Registrar Primera Venta</span>
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* VISTA EN TARJETAS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 md-elevation-1 md-card-interactive dark:border-neutral-800 dark:bg-neutral-900/80 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-500"></div>

              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white line-clamp-1">
                      {sale.product_name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                      <Calendar className="size-3" />
                      <span>{formatDate(sale.created_at)}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                    {sale.quantity} uds
                  </span>
                </div>

                {/* Cliente & Método de pago */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                    <User className="size-3.5 text-neutral-400" />
                    <span className="font-medium truncate max-w-[120px]">
                      {sale.customer_name || "Cliente General"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    <CreditCard className="size-3" />
                    {sale.payment_method}
                  </span>
                </div>

                {/* Badge Ganancia Neta */}
                <div className="my-3.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Ganancia Neta Real
                    </span>
                    <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                      +${sale.net_profit_usd.toFixed(2)} USD
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      +Bs. {sale.net_profit_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Margen</span>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      +{sale.profit_margin_percent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Desglose Financiero */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-neutral-400">Total Cobrado ({sale.quantity} uds)</span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      ${sale.total_income_usd.toFixed(2)} USD
                    </div>
                    <div className="text-[10px] text-neutral-500 font-medium">
                      Bs. {sale.total_income_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      (Bs. {sale.unit_price_ves.toFixed(2)} c/u)
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-neutral-400">Costo de las {sale.quantity} uds</span>
                    <div className="font-semibold text-neutral-700 dark:text-neutral-300">
                      ${sale.total_cost_usd.toFixed(2)} USD
                    </div>
                    <div className="text-[10px] text-neutral-400 font-medium">
                      Bs. {sale.total_cost_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      (Bs. {(sale.unit_cost_usd * sale.bcv_rate).toFixed(2)} c/u)
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {sale.notes && (
                  <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1">
                    <Tag className="size-3 text-neutral-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 italic">{sale.notes}</span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDetailItem(sale);
                    setOpenDetailModal(true);
                  }}
                  className="h-8 px-2.5 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg md-ripple"
                  title="Ver detalle"
                >
                  <Eye className="size-3.5 mr-1" />
                  <span>Detalle</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(sale)}
                  className="h-8 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg md-ripple"
                  title="Editar venta"
                >
                  <Pencil className="size-3.5 mr-1" />
                  <span>Editar</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setItemToDelete(sale);
                    setOpenDeleteModal(true);
                  }}
                  className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg md-ripple"
                  title="Eliminar venta"
                >
                  <Trash2 className="size-3.5 mr-1" />
                  <span>Eliminar</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA EN TABLA */
        <div className="rounded-2xl border border-neutral-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 md-elevation-1 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Registro de Ventas & Transacciones
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Historial de operaciones con precios, ingresos y rentabilidad neta
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
              {filteredSales.length} Ventas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 dark:bg-neutral-950/50 border-b border-neutral-200/70 dark:border-neutral-800/70 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Producto / Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Cantidad</th>
                  <th className="py-3 px-4">Precio Unitario</th>
                  <th className="py-3 px-4">Total Cobrado</th>
                  <th className="py-3 px-4">Costo Lote</th>
                  <th className="py-3 px-4">Ganancia Neta</th>
                  <th className="py-3 px-4">Margen</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                      <div className="font-semibold">{sale.product_name}</div>
                      <div className="text-[11px] text-neutral-400">
                        {sale.customer_name || "Cliente General"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                        {sale.quantity} uds
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300 font-medium">
                      <div>${sale.unit_price_usd.toFixed(2)}</div>
                      <div className="text-[10px] text-neutral-400">Bs. {sale.unit_price_ves.toFixed(2)}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                      <div>${sale.total_income_usd.toFixed(2)}</div>
                      <div className="text-[10px] font-normal text-neutral-500">
                        Bs. {sale.total_income_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                      <div>${sale.total_cost_usd.toFixed(2)}</div>
                      <div className="text-[10px] text-neutral-400">
                        Bs. {sale.total_cost_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        +${sale.net_profit_usd.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium">
                        +Bs. {sale.net_profit_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        +{sale.profit_margin_percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setDetailItem(sale);
                            setOpenDetailModal(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors md-ripple"
                          title="Ver Detalle"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(sale)}
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors md-ripple"
                          title="Editar Venta"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(sale);
                            setOpenDeleteModal(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors md-ripple"
                          title="Eliminar Venta"
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

      {/* ================= MODAL 1: REGISTRAR NUEVA VENTA (CREATE) ================= */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar Nueva Venta</DialogTitle>
            <DialogDescription>
              Selecciona un producto de tu inventario o ingresa una venta directa. Puedes ingresar el monto total cobrado o el precio por unidad.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSale} className="space-y-4 pt-1">
            {createError && (
              <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Selector de Lote / Inversión */}
            {investments.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lotSelect" className="text-xs font-semibold flex items-center gap-1.5">
                    <Layers className="size-3.5 text-blue-600" />
                    <span>Lote de Inversión / Inventario</span>
                  </Label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Cálculo proporcional exacto
                  </span>
                </div>
                <select
                  id="lotSelect"
                  value={selectedInvestmentId}
                  onChange={(e) => handleLotSelect(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-neutral-200 bg-white px-3 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 focus:outline-none font-medium"
                >
                  <option value="">-- Venta manual o producto sin lote previo --</option>
                  {investments.map((inv) => {
                    const isOutOfStock = inv.quantity <= 0;
                    return (
                      <option key={inv.id} value={inv.id} disabled={isOutOfStock}>
                        {isOutOfStock ? "🔴 AGOTADO: " : "📦 "}
                        {inv.product_name} ({inv.quantity} disponibles de {inv.initial_quantity || inv.quantity} uds | Costo: ${inv.unit_cost_usd.toFixed(2)} USD)
                      </option>
                    );
                  })}
                </select>

                {selectedLot && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    numQuantity > selectedLot.quantity
                      ? "bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                      : "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/60 text-blue-900 dark:text-blue-200"
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>📦 Lote: {selectedLot.product_name}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        selectedLot.quantity <= 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                          : "bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200"
                      }`}>
                        Stock disponible: {selectedLot.quantity} de {selectedLot.initial_quantity || selectedLot.quantity} unidades
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        Costo unitario real: <strong>${selectedLot.unit_cost_usd.toFixed(2)} USD</strong> (Bs. {(selectedLot.unit_cost_ves || selectedLot.unit_cost_usd * numBcvRate).toFixed(2)} c/u)
                      </div>
                      <div>
                        Costo base de estas {numQuantity} uds: <strong>${(selectedLot.unit_cost_usd * numQuantity).toFixed(2)} USD</strong>
                      </div>
                    </div>
                    <div className="pt-1.5 text-[11px] font-medium border-t border-current/20 flex items-center justify-between">
                      {numQuantity > selectedLot.quantity ? (
                        <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          ¡Stock insuficiente! Quieres vender {numQuantity} uds pero solo dispones de {selectedLot.quantity} uds.
                        </span>
                      ) : (
                        <>
                          <span>El sistema descontará {numQuantity} uds del inventario automáticamente.</span>
                          <span>Stock restante: <strong>{selectedLot.quantity - numQuantity} uds</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 1: Nombre del Producto + Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="product">Nombre del Producto</Label>
                <Input
                  id="product"
                  placeholder="Ej. Audífonos Bluetooth Pro"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer">Nombre del Cliente (Opcional)</Label>
                <Input
                  id="customer"
                  placeholder="Ej. Diana / Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Row 2: Cantidad, Tasa BCV, Método de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Cantidad */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Cantidad Vendida (Uds)</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    className="pl-8 font-semibold rounded-xl"
                    value={quantity}
                    onChange={(e) => {
                      const newQty = e.target.value;
                      setQuantity(newQty);
                      const q = Math.max(1, parseInt(newQty) || 1);
                      if (priceMode === "total" && totalIncomeInputVes) {
                        const totVes = parseFloat(totalIncomeInputVes) || 0;
                        setUnitPriceInputVes((totVes / q).toFixed(2));
                        setUnitPriceInputUsd((totVes / numBcvRate / q).toFixed(2));
                      } else if (priceMode === "unit" && unitPriceInputVes) {
                        const uVes = parseFloat(unitPriceInputVes) || 0;
                        setTotalIncomeInputVes((uVes * q).toFixed(2));
                        setTotalIncomeInputUsd(((uVes * q) / numBcvRate).toFixed(2));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              {/* Tasa BCV */}
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
                    className="pl-8 font-semibold rounded-xl"
                    value={bcvRate}
                    onChange={(e) => {
                      setBcvRate(e.target.value);
                      const rate = parseFloat(e.target.value) || 1;
                      if (priceMode === "total" && totalIncomeInputUsd) {
                        setTotalIncomeInputVes((parseFloat(totalIncomeInputUsd) * rate).toFixed(2));
                      } else if (priceMode === "unit" && unitPriceInputUsd) {
                        setUnitPriceInputVes((parseFloat(unitPriceInputUsd) * rate).toFixed(2));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-neutral-200 bg-white px-3 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Entry Mode Switcher (Total Cobrado vs Por Unidad) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-50 to-indigo-50/40 dark:from-neutral-950 dark:to-indigo-950/20 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Calculator className="size-3.5 text-indigo-600" />
                  <span>¿Cómo deseas ingresar el precio de la venta?</span>
                </span>

                <div className="flex items-center bg-white dark:bg-neutral-900 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setPriceMode("total")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      priceMode === "total"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Monto Total Cobrado ({numQuantity} uds)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode("unit")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      priceMode === "unit"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Precio Por Unidad (c/u)
                  </button>
                </div>
              </div>

              {/* Price Inputs */}
              {priceMode === "total" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="totalIncomeVes" className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Monto Total Cobrado por las {numQuantity} uds (VES)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-indigo-600 font-bold">
                        Bs.
                      </span>
                      <Input
                        id="totalIncomeVes"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 8000"
                        className="pl-9 font-bold text-sm rounded-xl border-indigo-200 focus:border-indigo-500"
                        value={totalIncomeInputVes}
                        onChange={(e) => handleTotalVesChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Equivale a: <strong>Bs. {computedUnitPriceVes.toFixed(2)}</strong> por unidad
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="totalIncomeUsd" className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Monto Total Cobrado ($ USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 size-3.5 text-indigo-600" />
                      <Input
                        id="totalIncomeUsd"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 9.91"
                        className="pl-8 font-bold text-sm rounded-xl border-indigo-200 focus:border-indigo-500"
                        value={totalIncomeInputUsd}
                        onChange={(e) => handleTotalUsdChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Equivale a: <strong>${computedUnitPriceUsd.toFixed(2)} USD</strong> por unidad
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="unitPriceVes" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Precio de Venta por Unidad (VES)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                        Bs.
                      </span>
                      <Input
                        id="unitPriceVes"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 2000"
                        className="pl-9 font-bold text-sm rounded-xl"
                        value={unitPriceInputVes}
                        onChange={(e) => handleUnitVesChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Total por {numQuantity} uds: <strong>Bs. {computedTotalIncomeVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="unitPriceUsd" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Precio de Venta por Unidad ($ USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                      <Input
                        id="unitPriceUsd"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 2.48"
                        className="pl-8 font-bold text-sm rounded-xl"
                        value={unitPriceInputUsd}
                        onChange={(e) => handleUnitUsdChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Total por {numQuantity} uds: <strong>${computedTotalIncomeUsd.toFixed(2)} USD</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Observaciones */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Observaciones / Nro de Comprobante</Label>
              <Input
                id="notes"
                placeholder="Referencia de pago móvil, factura, notas de entrega..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Live Profit Calculation Banner */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 border border-neutral-800 space-y-2 md-elevation-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-emerald-400" />
                  <span>Resultado Real de la Venta ({numQuantity} {numQuantity === 1 ? "unidad" : "unidades"}):</span>
                </div>
                <span className="text-xs text-emerald-400 font-extrabold bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Margen: +{computedMarginPercent.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700/60 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Total Cobrado</div>
                  <div className="font-extrabold text-xs sm:text-sm text-white">
                    ${computedTotalIncomeUsd.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {computedTotalIncomeVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700/60 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Costo {numQuantity} uds</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-300">
                    ${computedTotalCostUsd.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {computedTotalCostVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800 shadow-2xs">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">
                    Ganancia ($ USD)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300">
                    +${computedNetProfitUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                    Neta en Dólares
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800 shadow-2xs">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">
                    Ganancia (VES)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300">
                    +Bs. {computedNetProfitVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                    Neta en Bolívares
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
                {submittingCreate ? "Guardando..." : "Guardar Venta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 2: EDITAR VENTA (UPDATE) ================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Venta</DialogTitle>
            <DialogDescription>
              Modifica los datos de la transacción. El sistema recalcula la ganancia neta proporcional en USD y Bolívares.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateSale} className="space-y-4 pt-1">
            {editError && (
              <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Lote de Inversión vinculable en Edit */}
            {investments.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editLotSelect" className="text-xs font-semibold flex items-center gap-1.5">
                    <Layers className="size-3.5 text-blue-600" />
                    <span>Lote de Inversión / Inventario</span>
                  </Label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                    Cálculo proporcional
                  </span>
                </div>
                <select
                  id="editLotSelect"
                  value={editInvestmentId}
                  onChange={(e) => handleEditLotSelect(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-neutral-200 bg-white px-3 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 focus:outline-none font-medium"
                >
                  <option value="">-- Venta manual o producto sin lote previo --</option>
                  {investments.map((inv) => {
                    const isSameLot = editingItem?.investment_id === inv.id;
                    const availableForEdit = isSameLot ? inv.quantity + (editingItem?.quantity || 0) : inv.quantity;
                    const isOutOfStock = availableForEdit <= 0;
                    return (
                      <option key={inv.id} value={inv.id} disabled={isOutOfStock}>
                        {isOutOfStock ? "🔴 AGOTADO: " : "📦 "}
                        {inv.product_name} ({availableForEdit} disponibles | Lote de {inv.initial_quantity || inv.quantity} uds | Costo: ${inv.unit_cost_usd.toFixed(2)} USD)
                      </option>
                    );
                  })}
                </select>

                {editSelectedLot && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    (() => {
                      const isSameLot = editingItem?.investment_id === editInvestmentId;
                      const maxAvail = isSameLot ? editSelectedLot.quantity + (editingItem?.quantity || 0) : editSelectedLot.quantity;
                      return editNumQuantity > maxAvail;
                    })()
                      ? "bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
                      : "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/60 text-blue-900 dark:text-blue-200"
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span>📦 Lote: {editSelectedLot.product_name}</span>
                      <span className="bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md text-[11px] font-bold text-blue-900 dark:text-blue-200">
                        Stock en almacén: {editSelectedLot.quantity} uds (Lote original: {editSelectedLot.initial_quantity || editSelectedLot.quantity} uds)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        Costo unitario real: <strong>${editSelectedLot.unit_cost_usd.toFixed(2)} USD</strong> (Bs. {(editSelectedLot.unit_cost_ves || editSelectedLot.unit_cost_usd * editNumBcvRate).toFixed(2)} c/u)
                      </div>
                      <div>
                        Costo proporcional {editNumQuantity} uds: <strong>${(editSelectedLot.unit_cost_usd * editNumQuantity).toFixed(2)} USD</strong>
                      </div>
                    </div>
                    <div className="pt-1.5 text-[11px] font-medium border-t border-current/20 flex items-center justify-between">
                      {(() => {
                        const isSameLot = editingItem?.investment_id === editInvestmentId;
                        const maxAvail = isSameLot ? editSelectedLot.quantity + (editingItem?.quantity || 0) : editSelectedLot.quantity;
                        if (editNumQuantity > maxAvail) {
                          return (
                            <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                              <AlertTriangle className="size-3.5 shrink-0" />
                              ¡Stock insuficiente! Máximo disponible para esta venta: {maxAvail} uds.
                            </span>
                          );
                        }
                        return (
                          <span>El inventario se reajustará automáticamente con la diferencia.</span>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 1: Nombre del Producto + Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editProduct">Nombre del Producto</Label>
                <Input
                  id="editProduct"
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  className="rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editCustomer">Cliente</Label>
                <Input
                  id="editCustomer"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Row 2: Cantidad, Tasa BCV, Método de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editQuantity">Cantidad (Uds)</Label>
                <div className="relative">
                  <Package className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editQuantity"
                    type="number"
                    min="1"
                    className="pl-8 font-semibold rounded-xl"
                    value={editQuantity}
                    onChange={(e) => {
                      const newQty = e.target.value;
                      setEditQuantity(newQty);
                      const q = Math.max(1, parseInt(newQty) || 1);
                      if (editPriceMode === "total" && editTotalIncomeInputVes) {
                        const totVes = parseFloat(editTotalIncomeInputVes) || 0;
                        setEditUnitPriceInputVes((totVes / q).toFixed(2));
                        setEditUnitPriceInputUsd((totVes / editNumBcvRate / q).toFixed(2));
                      } else if (editPriceMode === "unit" && editUnitPriceInputVes) {
                        const uVes = parseFloat(editUnitPriceInputVes) || 0;
                        setEditTotalIncomeInputVes((uVes * q).toFixed(2));
                        setEditTotalIncomeInputUsd(((uVes * q) / editNumBcvRate).toFixed(2));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editBcvRate">Tasa BCV</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                  <Input
                    id="editBcvRate"
                    type="number"
                    step="0.01"
                    className="pl-8 font-semibold rounded-xl"
                    value={editBcvRate}
                    onChange={(e) => {
                      setEditBcvRate(e.target.value);
                      const rate = parseFloat(e.target.value) || 1;
                      if (editPriceMode === "total" && editTotalIncomeInputUsd) {
                        setEditTotalIncomeInputVes((parseFloat(editTotalIncomeInputUsd) * rate).toFixed(2));
                      } else if (editPriceMode === "unit" && editUnitPriceInputUsd) {
                        setEditUnitPriceInputVes((parseFloat(editUnitPriceInputUsd) * rate).toFixed(2));
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editPaymentMethod">Método de Pago</Label>
                <select
                  id="editPaymentMethod"
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-neutral-200 bg-white px-3 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Entry Mode Switcher for Edit */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-neutral-50 to-indigo-50/40 dark:from-neutral-950 dark:to-indigo-950/20 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <Calculator className="size-3.5 text-indigo-600" />
                  <span>Modo de ingreso del precio</span>
                </span>

                <div className="flex items-center bg-white dark:bg-neutral-900 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setEditPriceMode("total")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      editPriceMode === "total"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Monto Total Cobrado ({editNumQuantity} uds)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPriceMode("unit")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      editPriceMode === "unit"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    Precio Por Unidad (c/u)
                  </button>
                </div>
              </div>

              {editPriceMode === "total" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="editTotalIncomeVes" className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Monto Total Cobrado por las {editNumQuantity} uds (VES)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-indigo-600 font-bold">
                        Bs.
                      </span>
                      <Input
                        id="editTotalIncomeVes"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 8000"
                        className="pl-9 font-bold text-sm rounded-xl border-indigo-200 focus:border-indigo-500"
                        value={editTotalIncomeInputVes}
                        onChange={(e) => handleEditTotalVesChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Equivale a: <strong>Bs. {editComputedUnitPriceVes.toFixed(2)}</strong> por unidad
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editTotalIncomeUsd" className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      Monto Total Cobrado ($ USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 size-3.5 text-indigo-600" />
                      <Input
                        id="editTotalIncomeUsd"
                        type="number"
                        step="0.01"
                        placeholder="Ej. 9.91"
                        className="pl-8 font-bold text-sm rounded-xl border-indigo-200 focus:border-indigo-500"
                        value={editTotalIncomeInputUsd}
                        onChange={(e) => handleEditTotalUsdChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Equivale a: <strong>${editComputedUnitPriceUsd.toFixed(2)} USD</strong> por unidad
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="editUnitPriceVes" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Precio de Venta por Unidad (VES)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">
                        Bs.
                      </span>
                      <Input
                        id="editUnitPriceVes"
                        type="number"
                        step="0.01"
                        className="pl-9 font-bold text-sm rounded-xl"
                        value={editUnitPriceInputVes}
                        onChange={(e) => handleEditUnitVesChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Total por {editNumQuantity} uds: <strong>Bs. {editComputedTotalIncomeVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</strong>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="editUnitPriceUsd" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Precio de Venta por Unidad ($ USD)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
                      <Input
                        id="editUnitPriceUsd"
                        type="number"
                        step="0.01"
                        className="pl-8 font-bold text-sm rounded-xl"
                        value={editUnitPriceInputUsd}
                        onChange={(e) => handleEditUnitUsdChange(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Total por {editNumQuantity} uds: <strong>${editComputedTotalIncomeUsd.toFixed(2)} USD</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Observaciones */}
            <div className="space-y-1.5">
              <Label htmlFor="editNotes">Observaciones</Label>
              <Input
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Recalculation Preview Banner */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 border border-neutral-800 space-y-2 md-elevation-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-200">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-emerald-400" />
                  <span>Nuevo Cálculo Real ({editNumQuantity} {editNumQuantity === 1 ? "unidad" : "unidades"}):</span>
                </div>
                <span className="text-xs text-emerald-400 font-extrabold bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Margen: +{editComputedMarginPercent.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center">
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700/60 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Total Cobrado</div>
                  <div className="font-extrabold text-xs sm:text-sm text-white">
                    ${editComputedTotalIncomeUsd.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {editComputedTotalIncomeVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700/60 shadow-2xs">
                  <div className="text-[10px] text-neutral-400 uppercase font-semibold">Costo {editNumQuantity} uds</div>
                  <div className="font-extrabold text-xs sm:text-sm text-neutral-300">
                    ${editComputedTotalCostUsd.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Bs. {editComputedTotalCostVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800 shadow-2xs">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">
                    Ganancia ($ USD)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300">
                    +${editComputedNetProfitUsd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                    Neta en Dólares
                  </div>
                </div>

                <div className="bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-800 shadow-2xs">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">
                    Ganancia (VES)
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-emerald-300">
                    +Bs. {editComputedNetProfitVes.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                    Neta en Bolívares
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

      {/* ================= MODAL 3: DETALLE DE VENTA (READ) ================= */}
      <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-neutral-600" />
              <span>Detalle de Venta</span>
            </DialogTitle>
            <DialogDescription>
              Ficha de transacción y rentabilidad neta generada.
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800">
                <span className="text-[11px] text-neutral-400 font-semibold uppercase">Producto Vendido</span>
                <h4 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  {detailItem.product_name}
                </h4>
                <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    <span>{detailItem.customer_name || "Cliente General"}</span>
                  </div>
                  <span className="font-semibold bg-neutral-200/70 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[11px]">
                    {detailItem.payment_method}
                  </span>
                </div>
              </div>

              {/* Ganancia Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase">Ganancia Neta</span>
                  <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                    +${detailItem.net_profit_usd.toFixed(2)} USD
                  </div>
                  <div className="text-[11px] text-emerald-600/90 font-bold">
                    +Bs. {detailItem.net_profit_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase">Margen de Ganancia</span>
                  <div className="text-xl font-extrabold text-neutral-900 dark:text-white mt-0.5">
                    +{detailItem.profit_margin_percent.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Sobre costo de adquisición
                  </div>
                </div>
              </div>

              {/* Desglose */}
              <div className="space-y-2 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Unidades Vendidas:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {detailItem.quantity} uds
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Precio Unitario de Venta:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    ${detailItem.unit_price_usd.toFixed(2)} USD (Bs. {detailItem.unit_price_ves.toFixed(2)} c/u)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Tasa BCV Aplicada:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {detailItem.bcv_rate.toFixed(2)} VES/USD
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Costo Base por Unidad:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    ${detailItem.unit_cost_usd.toFixed(2)} USD (Bs. {(detailItem.unit_cost_usd * detailItem.bcv_rate).toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Costo Total de las {detailItem.quantity} uds:</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    ${detailItem.total_cost_usd.toFixed(2)} USD (Bs. {detailItem.total_cost_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800/60">
                  <span className="text-neutral-500">Total Ingreso Cobrado:</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    ${detailItem.total_income_usd.toFixed(2)} USD (Bs. {detailItem.total_income_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-700 dark:text-neutral-300 font-bold">Fecha de Registro:</span>
                  <span className="text-neutral-500 font-medium">
                    {formatDate(detailItem.created_at)}
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
                Editar Venta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 4: CONFIRMAR ELIMINACIÓN ================= */}
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-2 md-elevation-1">
              <Trash2 className="size-6" />
            </div>
            <DialogTitle className="text-center">¿Eliminar esta Venta?</DialogTitle>
            <DialogDescription className="text-center">
              Esta acción eliminará el registro de venta y recalculará automáticamente los ingresos y ganancias acumuladas.
            </DialogDescription>
          </DialogHeader>

          {itemToDelete && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1">
              <div className="font-bold text-neutral-900 dark:text-white">
                {itemToDelete.product_name}
              </div>
              <div className="text-neutral-500">
                Total Cobrado: ${itemToDelete.total_income_usd.toFixed(2)} USD (Bs. {itemToDelete.total_income_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })})
              </div>
              <div className="text-neutral-400 text-[11px]">
                {itemToDelete.quantity} unidades vendidas
              </div>
              <div className="text-emerald-600 font-semibold">
                Ganancia neta: +${itemToDelete.net_profit_usd.toFixed(2)} USD (+Bs. {itemToDelete.net_profit_ves.toLocaleString("es-VE", { minimumFractionDigits: 2 })})
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
              {deleting ? "Eliminando..." : "Sí, Eliminar Venta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
