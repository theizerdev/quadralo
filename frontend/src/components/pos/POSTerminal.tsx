"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import {
  Search,
  Barcode,
  Receipt,
  Plus,
  Trash2,
  Printer,
  X,
  Check,
  CreditCard,
  DollarSign,
  User,
  Tag,
  AlertCircle,
  ArrowRight,
  Minus,
  RefreshCw,
  History,
  Sparkles,
  Calculator,
  ShoppingCart,
  CheckCircle2,
  Package,
  Layers,
  Coins,
  FileText,
  ScanLine,
} from "lucide-react";

// --- Types ---
export interface POSCatalogItem {
  id?: string;
  investment_id: string;
  product_name: string;
  barcode?: string;
  category?: string;
  unit_cost_usd: number;
  suggested_price_usd: number;
  suggested_price_ves: number;
  available_stock: number;
  stock_available?: number;
  bcv_rate: number;
}

export interface TicketCartItem {
  id: string;
  investment_id?: string;
  product_name: string;
  barcode?: string;
  category?: string;
  unit_cost_usd: number;
  unit_price_usd: number;
  unit_price_ves: number;
  quantity: number;
  available_stock: number;
  subtotal_usd: number;
  subtotal_ves: number;
}

export interface TicketTab {
  id: number;
  name: string;
  cart: TicketCartItem[];
  customerName: string;
  customerId?: string;
  discountUSD: number;
  notes?: string;
  createdAt: Date;
}

export interface RecentSaleItem {
  id: string;
  product_name: string;
  barcode?: string;
  quantity: number;
  unit_price_usd: number;
  unit_price_ves: number;
  subtotal_usd?: number;
  subtotal_ves?: number;
  total_income_usd?: number;
  total_income_ves?: number;
}

export interface RecentSalePayment {
  id: string;
  amount_usd: number;
  amount_ves: number;
  payment_method: string;
}

export interface RecentSale {
  id: string;
  ticket_code?: string;
  product_name: string;
  quantity: number;
  subtotal_usd?: number;
  subtotal_ves?: number;
  discount_usd?: number;
  discount_ves?: number;
  total_income_usd: number;
  total_income_ves: number;
  bcv_rate: number;
  payment_method: string;
  payment_status: "paid" | "partial" | "pending";
  customer_name?: string;
  created_at: string;
  items?: RecentSaleItem[];
  payments?: RecentSalePayment[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_debt_usd?: number;
}

const PAYMENT_METHODS = [
  "Efectivo USD",
  "Pago Móvil",
  "Punto de Venta",
  "Efectivo VES",
  "Zelle",
  "Transferencia VES",
  "Binance / USDT",
  "Otro",
];

// Audio feedback helper
function playAudioBeep(type: "success" | "error" = "success") {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Ignore audio permission/context errors
  }
}

interface POSTerminalProps {
  onViewAdmin?: () => void;
  onSaleCompleted?: () => void;
}

export function POSTerminal({ onViewAdmin, onSaleCompleted }: POSTerminalProps) {
  // --- Core State ---
  const [catalog, setCatalog] = useState<POSCatalogItem[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(75.5);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);

  // Multi-Ticket Tabs
  const [tickets, setTickets] = useState<TicketTab[]>([
    {
      id: 1,
      name: "Ticket 1",
      cart: [],
      customerName: "Cliente General",
      discountUSD: 0,
      createdAt: new Date(),
    },
  ]);
  const [activeTicketId, setActiveTicketId] = useState<number>(1);

  // Barcode / Fast Input
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState<number>(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // --- Modals State ---
  // F11: Checkout Modal
  const [openCheckoutModal, setOpenCheckoutModal] = useState<boolean>(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("Efectivo USD");
  const [isCreditSale, setIsCreditSale] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [checkoutNotes, setCheckoutNotes] = useState<string>("");
  // Cash received & Change calculation
  const [amountReceivedUSD, setAmountReceivedUSD] = useState<string>("");
  const [amountReceivedVES, setAmountReceivedVES] = useState<string>("");

  // F10: Catalog Search Modal
  const [openSearchModal, setOpenSearchModal] = useState<boolean>(false);
  const [catalogFilter, setCatalogFilter] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Todas");

  // F9: Price Verifier Modal
  const [openVerifierModal, setOpenVerifierModal] = useState<boolean>(false);
  const [verifierInput, setVerifierInput] = useState<string>("");
  const [verifiedItem, setVerifiedItem] = useState<POSCatalogItem | null>(null);

  // INS: Miscellaneous Item Modal
  const [openMiscModal, setOpenMiscModal] = useState<boolean>(false);
  const [miscName, setMiscName] = useState<string>("");
  const [miscPriceUSD, setMiscPriceUSD] = useState<string>("");
  const [miscPriceVES, setMiscPriceVES] = useState<string>("");
  const [miscQuantity, setMiscQuantity] = useState<string>("1");

  // F6: Customer Selector Modal
  const [openCustomerModal, setOpenCustomerModal] = useState<boolean>(false);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustPhone, setNewCustPhone] = useState<string>("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  // F4: Recent Sales Modal
  const [openRecentSalesModal, setOpenRecentSalesModal] = useState<boolean>(false);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loadingRecentSales, setLoadingRecentSales] = useState<boolean>(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  // Thermal Receipt Modal
  const [openReceiptModal, setOpenReceiptModal] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<RecentSale | null>(null);

  // --- Active Ticket Helpers ---
  const activeTicket = useMemo(() => {
    return tickets.find((t) => t.id === activeTicketId) || tickets[0];
  }, [tickets, activeTicketId]);

  const updateActiveTicket = useCallback((updater: (prev: TicketTab) => TicketTab) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicketId ? updater(t) : t))
    );
  }, [activeTicketId]);

  // Calculations for Active Ticket
  const ticketSubtotalUSD = useMemo(() => {
    return activeTicket?.cart.reduce((sum, item) => sum + item.subtotal_usd, 0) || 0;
  }, [activeTicket]);

  const ticketSubtotalVES = useMemo(() => {
    return ticketSubtotalUSD * bcvRate;
  }, [ticketSubtotalUSD, bcvRate]);

  const ticketDiscountUSD = activeTicket?.discountUSD || 0;
  const ticketDiscountVES = ticketDiscountUSD * bcvRate;

  const ticketTotalUSD = Math.max(0, ticketSubtotalUSD - ticketDiscountUSD);
  const ticketTotalVES = ticketTotalUSD * bcvRate;

  const totalItemsCount = useMemo(() => {
    return activeTicket?.cart.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [activeTicket]);

  // Initial Load
  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const items = await apiFetch<any[]>("/sales/pos/catalog");
      const normalized: POSCatalogItem[] = (items || []).map((it) => ({
        ...it,
        investment_id: it.investment_id || it.id || "",
        available_stock: it.available_stock ?? it.stock_available ?? 0,
        unit_cost_usd: it.unit_cost_usd || 0,
        suggested_price_usd: it.suggested_price_usd || 0,
        suggested_price_ves: it.suggested_price_ves || 0,
        bcv_rate: it.bcv_rate || 1,
      }));
      setCatalog(normalized);
      if (normalized.length > 0 && normalized[0].bcv_rate) {
        setBcvRate(normalized[0].bcv_rate);
      }
    } catch (err: any) {
      console.error("Error al cargar catálogo POS:", err);
      notify.error("Error de catálogo", "No se pudo cargar el inventario del punto de venta.");
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Autofocus barcode input on mount and when modals close
  useEffect(() => {
    if (
      !openCheckoutModal &&
      !openSearchModal &&
      !openVerifierModal &&
      !openMiscModal &&
      !openCustomerModal &&
      !openRecentSalesModal &&
      !openReceiptModal
    ) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
    }
  }, [
    openCheckoutModal,
    openSearchModal,
    openVerifierModal,
    openMiscModal,
    openCustomerModal,
    openRecentSalesModal,
    openReceiptModal,
  ]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category && item.category.trim()) set.add(item.category.trim());
    });
    return ["Todas", ...Array.from(set).sort()];
  }, [catalog]);

  // Search suggestions for fast input
  const searchSuggestions = useMemo(() => {
    const term = barcodeInput.trim().toLowerCase();
    if (!term || term.includes("*")) return [];
    return catalog
      .filter((item) => {
        const matchName = item.product_name.toLowerCase().includes(term);
        const matchCode = item.barcode?.toLowerCase().includes(term);
        const matchCat = item.category?.toLowerCase().includes(term);
        return matchName || matchCode || matchCat;
      })
      .slice(0, 8);
  }, [catalog, barcodeInput]);

  useEffect(() => {
    if (searchSuggestions.length > 0 && barcodeInput.length >= 2) {
      setIsDropdownOpen(true);
      setSelectedSearchIndex(0);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchSuggestions, barcodeInput]);

  // --- Cart Actions ---
  const addItemToCart = useCallback(
    (item: POSCatalogItem, qtyToAdd: number = 1) => {
      if (item.available_stock <= 0) {
        playAudioBeep("error");
        notify.warning("Sin stock disponible", `El producto "${item.product_name}" está agotado.`);
        return;
      }

      updateActiveTicket((prev) => {
        const existingIdx = prev.cart.findIndex(
          (c) => c.investment_id === item.investment_id
        );

        let newCart = [...prev.cart];
        if (existingIdx >= 0) {
          const current = newCart[existingIdx];
          const newQty = current.quantity + qtyToAdd;

          if (newQty > item.available_stock) {
            playAudioBeep("error");
            notify.warning(
              "Límite de stock",
              `Solo hay ${item.available_stock} unidades disponibles en inventario.`
            );
            return prev;
          }

          const unitUsd = current.unit_price_usd;
          const unitVes = unitUsd * bcvRate;
          newCart[existingIdx] = {
            ...current,
            quantity: newQty,
            unit_price_ves: unitVes,
            subtotal_usd: Number((unitUsd * newQty).toFixed(2)),
            subtotal_ves: Number((unitVes * newQty).toFixed(2)),
          };
        } else {
          if (qtyToAdd > item.available_stock) {
            playAudioBeep("error");
            notify.warning(
              "Límite de stock",
              `Solo hay ${item.available_stock} unidades disponibles en inventario.`
            );
            return prev;
          }

          const unitUsd = item.suggested_price_usd;
          const unitVes = item.suggested_price_ves || unitUsd * bcvRate;
          newCart.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            investment_id: item.investment_id,
            product_name: item.product_name,
            barcode: item.barcode,
            category: item.category,
            unit_cost_usd: item.unit_cost_usd,
            unit_price_usd: unitUsd,
            unit_price_ves: unitVes,
            quantity: qtyToAdd,
            available_stock: item.available_stock,
            subtotal_usd: Number((unitUsd * qtyToAdd).toFixed(2)),
            subtotal_ves: Number((unitVes * qtyToAdd).toFixed(2)),
          });
        }

        playAudioBeep("success");
        return { ...prev, cart: newCart };
      });
    },
    [bcvRate, updateActiveTicket]
  );

  const updateCartItemQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeCartItem(cartItemId);
      return;
    }

    updateActiveTicket((prev) => {
      const newCart = prev.cart.map((item) => {
        if (item.id === cartItemId) {
          if (item.investment_id && newQty > item.available_stock) {
            playAudioBeep("error");
            notify.warning(
              "Stock insuficiente",
              `Disponibles en inventario: ${item.available_stock} uds.`
            );
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            subtotal_usd: Number((item.unit_price_usd * newQty).toFixed(2)),
            subtotal_ves: Number((item.unit_price_ves * newQty).toFixed(2)),
          };
        }
        return item;
      });
      return { ...prev, cart: newCart };
    });
  };

  const updateCartItemPrice = (cartItemId: string, newPriceUsd: number) => {
    const validPrice = Math.max(0, newPriceUsd);
    updateActiveTicket((prev) => {
      const newCart = prev.cart.map((item) => {
        if (item.id === cartItemId) {
          const pVes = validPrice * bcvRate;
          return {
            ...item,
            unit_price_usd: validPrice,
            unit_price_ves: pVes,
            subtotal_usd: Number((validPrice * item.quantity).toFixed(2)),
            subtotal_ves: Number((pVes * item.quantity).toFixed(2)),
          };
        }
        return item;
      });
      return { ...prev, cart: newCart };
    });
  };

  const removeCartItem = (cartItemId: string) => {
    updateActiveTicket((prev) => ({
      ...prev,
      cart: prev.cart.filter((item) => item.id !== cartItemId),
    }));
  };

  const clearCurrentTicket = () => {
    if (activeTicket.cart.length === 0) return;
    if (confirm("¿Estás seguro de vaciar todos los artículos de este ticket?")) {
      updateActiveTicket((prev) => ({
        ...prev,
        cart: [],
        discountUSD: 0,
        customerName: "Cliente General",
        customerId: undefined,
      }));
      notify.info("Ticket vaciado", "Se han eliminado los artículos del ticket actual.");
    }
  };

  // --- Tab Management ---
  const addNewTicket = () => {
    const newId = (tickets[tickets.length - 1]?.id || 0) + 1;
    const newTab: TicketTab = {
      id: newId,
      name: `Ticket ${newId}`,
      cart: [],
      customerName: "Cliente General",
      discountUSD: 0,
      createdAt: new Date(),
    };
    setTickets((prev) => [...prev, newTab]);
    setActiveTicketId(newId);
    notify.success("Nuevo Ticket", `Se abrió la pestaña Ticket ${newId}`);
  };

  const closeTicket = (ticketId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tickets.length <= 1) {
      notify.warning("Acción no permitida", "Debes mantener al menos un ticket abierto.");
      return;
    }

    const targetTicket = tickets.find((t) => t.id === ticketId);
    if (targetTicket && targetTicket.cart.length > 0) {
      if (!confirm(`El "${targetTicket.name}" contiene artículos. ¿Deseas descartarlo?`)) {
        return;
      }
    }

    const nextTickets = tickets.filter((t) => t.id !== ticketId);
    setTickets(nextTickets);
    if (activeTicketId === ticketId) {
      setActiveTicketId(nextTickets[nextTickets.length - 1].id);
    }
  };

  // --- Fast Barcode & Search Input Handling ---
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    // Multiplier syntax check: e.g. "3*750100" or "2*Coca"
    let multiplier = 1;
    let query = raw;
    if (raw.includes("*")) {
      const parts = raw.split("*");
      const num = parseInt(parts[0], 10);
      if (!isNaN(num) && num > 0) {
        multiplier = num;
        query = parts.slice(1).join("*").trim();
      }
    }

    // 1. Exact barcode match
    const exactBarcodeItem = catalog.find(
      (item) => item.barcode && item.barcode.trim().toLowerCase() === query.toLowerCase()
    );

    if (exactBarcodeItem) {
      addItemToCart(exactBarcodeItem, multiplier);
      setBarcodeInput("");
      setIsDropdownOpen(false);
      return;
    }

    // 2. Exact product name match
    const exactNameItem = catalog.find(
      (item) => item.product_name.trim().toLowerCase() === query.toLowerCase()
    );

    if (exactNameItem) {
      addItemToCart(exactNameItem, multiplier);
      setBarcodeInput("");
      setIsDropdownOpen(false);
      return;
    }

    // 3. Dropdown selected suggestion
    if (searchSuggestions.length > 0) {
      const selected = searchSuggestions[selectedSearchIndex] || searchSuggestions[0];
      addItemToCart(selected, multiplier);
      setBarcodeInput("");
      setIsDropdownOpen(false);
      return;
    }

    // Not found
    playAudioBeep("error");
    notify.warning("No encontrado", `No se encontró ningún producto con el código o nombre "${query}".`);
  };

  // Keyboard navigation for search suggestions
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev - 1 + searchSuggestions.length) % searchSuggestions.length);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  // --- Global Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore inside form text inputs if they aren't shortcut keys
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      // F11: Checkout
      if (e.key === "F11") {
        e.preventDefault();
        if (activeTicket.cart.length === 0) {
          playAudioBeep("error");
          notify.warning("Ticket vacío", "Agrega artículos antes de cobrar.");
          return;
        }
        setOpenCheckoutModal(true);
        return;
      }

      // F10: Search Catalog
      if (e.key === "F10") {
        e.preventDefault();
        setOpenSearchModal(true);
        return;
      }

      // F9: Price Verifier
      if (e.key === "F9") {
        e.preventDefault();
        setVerifiedItem(null);
        setVerifierInput("");
        setOpenVerifierModal(true);
        return;
      }

      // F6: Customer
      if (e.key === "F6") {
        e.preventDefault();
        openCustomerDialog();
        return;
      }

      // F4: Recent Sales
      if (e.key === "F4") {
        e.preventDefault();
        openRecentSalesDialog();
        return;
      }

      // INS / Insert: Misc item
      if (e.key === "Insert") {
        e.preventDefault();
        setMiscName("");
        setMiscPriceUSD("");
        setMiscPriceVES("");
        setMiscQuantity("1");
        setOpenMiscModal(true);
        return;
      }

      // Escape: Close modals
      if (e.key === "Escape") {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeTicket, isDropdownOpen]);

  // --- F6: Customer Fetching & Creation ---
  const openCustomerDialog = async () => {
    setOpenCustomerModal(true);
    setLoadingCustomers(true);
    try {
      const res = await apiFetch<{ customers: CustomerSummary[]; items: CustomerSummary[] }>("/customers");
      setCustomers(res.customers || res.items || []);
    } catch {
      // If error or empty, keep empty array
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSelectCustomer = (name: string, id?: string) => {
    updateActiveTicket((prev) => ({
      ...prev,
      customerName: name,
      customerId: id,
    }));
    setOpenCustomerModal(false);
    notify.success("Cliente asignado", `Ticket asignado a "${name}".`);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setIsCreatingCustomer(true);
    try {
      const res = await apiFetch<any>("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim() || undefined,
        }),
      });
      notify.success("Cliente registrado", `"${res.name}" guardado exitosamente.`);
      handleSelectCustomer(res.name, res.id);
      setNewCustName("");
      setNewCustPhone("");
    } catch (err: any) {
      notify.error("Error al crear cliente", err.message || "No se pudo registrar el cliente.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // --- F4: Recent Sales Fetching & Voiding ---
  const openRecentSalesDialog = async () => {
    setOpenRecentSalesModal(true);
    setLoadingRecentSales(true);
    try {
      const res = await apiFetch<RecentSale[]>("/sales/pos/recent?limit=25");
      setRecentSales(res);
    } catch (err: any) {
      notify.error("Error", "No se pudieron cargar las ventas recientes.");
    } finally {
      setLoadingRecentSales(false);
    }
  };

  const handleVoidSale = async (sale: RecentSale) => {
    if (
      !confirm(
        `¿Confirmas anular la venta "${sale.ticket_code || sale.product_name}"? El inventario será devuelto al stock.`
      )
    ) {
      return;
    }

    setDeletingSaleId(sale.id);
    try {
      await apiFetch(`/sales/${sale.id}`, { method: "DELETE" });
      notify.success("Venta anulada", `Venta ${sale.ticket_code || ""} anulada y stock devuelto.`);
      setRecentSales((prev) => prev.filter((s) => s.id !== sale.id));
      await fetchCatalog(); // Refresh catalog stock
      onSaleCompleted?.();
    } catch (err: any) {
      notify.error("Error al anular", err.message || "No se pudo anular la venta.");
    } finally {
      setDeletingSaleId(null);
    }
  };

  const handleOpenReceiptFromSale = (sale: RecentSale) => {
    setReceiptData(sale);
    setOpenReceiptModal(true);
  };

  // --- F11: Complete Sale / Checkout ---
  const handleAmountUSDChange = (val: string) => {
    setAmountReceivedUSD(val);
    const num = parseFloat(val);
    if (!isNaN(num) && bcvRate > 0) {
      setAmountReceivedVES((num * bcvRate).toFixed(2));
    } else {
      setAmountReceivedVES("");
    }
  };

  const handleAmountVESChange = (val: string) => {
    setAmountReceivedVES(val);
    const num = parseFloat(val);
    if (!isNaN(num) && bcvRate > 0) {
      setAmountReceivedUSD((num / bcvRate).toFixed(2));
    } else {
      setAmountReceivedUSD("");
    }
  };

  // Calculated Change / Vuelto
  const numReceivedUSD = parseFloat(amountReceivedUSD) || 0;
  const changeDueUSD = Math.max(0, numReceivedUSD - ticketTotalUSD);
  const changeDueVES = changeDueUSD * bcvRate;

  const handleConfirmCheckout = async () => {
    if (activeTicket.cart.length === 0) {
      notify.warning("Carrito vacío", "No hay artículos para cobrar.");
      return;
    }

    if (isCreditSale && (!activeTicket.customerName || activeTicket.customerName === "Cliente General")) {
      notify.warning("Cliente requerido", "Para ventas a crédito debes especificar el nombre del cliente [F6].");
      return;
    }

    setCheckoutSubmitting(true);
    try {
      // Build items payload
      const itemsPayload = activeTicket.cart.map((item) => ({
        investment_id: item.investment_id || undefined,
        product_name: item.product_name,
        barcode: item.barcode || undefined,
        category: item.category || "General",
        quantity: item.quantity,
        unit_cost_usd: item.unit_cost_usd,
        unit_price_usd: item.unit_price_usd,
        unit_price_ves: item.unit_price_ves,
        subtotal_usd: item.subtotal_usd,
        subtotal_ves: item.subtotal_ves,
      }));

      // Payment status
      let paymentStatus: "paid" | "partial" | "pending" = "paid";
      let initPaidUsd = ticketTotalUSD;
      let initPaidVes = ticketTotalVES;

      if (isCreditSale) {
        if (numReceivedUSD > 0 && numReceivedUSD < ticketTotalUSD) {
          paymentStatus = "partial";
          initPaidUsd = numReceivedUSD;
          initPaidVes = numReceivedUSD * bcvRate;
        } else {
          paymentStatus = "pending";
          initPaidUsd = 0;
          initPaidVes = 0;
        }
      }

      const bodyPayload = {
        items: itemsPayload,
        subtotal_usd: Number(ticketSubtotalUSD.toFixed(2)),
        subtotal_ves: Number(ticketSubtotalVES.toFixed(2)),
        discount_usd: Number(ticketDiscountUSD.toFixed(2)),
        discount_ves: Number(ticketDiscountVES.toFixed(2)),
        total_income_usd: Number(ticketTotalUSD.toFixed(2)),
        total_income_ves: Number(ticketTotalVES.toFixed(2)),
        bcv_rate: bcvRate,
        payment_method: selectedPaymentMethod,
        payment_status: paymentStatus,
        initial_payment_usd: initPaidUsd,
        initial_payment_ves: initPaidVes,
        due_date: dueDate ? dueDate : undefined,
        customer_name: activeTicket.customerName.trim() || undefined,
        notes: checkoutNotes.trim() || undefined,
      };

      const completedSale = await apiFetch<RecentSale>("/sales/", {
        method: "POST",
        body: JSON.stringify(bodyPayload),
      });

      playAudioBeep("success");
      notify.success("¡Venta completada!", `Ticket ${completedSale.ticket_code || ""} emitido con éxito.`);

      // Open printable receipt
      setReceiptData(completedSale);
      setOpenCheckoutModal(false);
      setOpenReceiptModal(true);

      // Reset current ticket cart
      updateActiveTicket((prev) => ({
        ...prev,
        cart: [],
        discountUSD: 0,
        customerName: "Cliente General",
        customerId: undefined,
      }));

      // Reset checkout inputs
      setAmountReceivedUSD("");
      setAmountReceivedVES("");
      setIsCreditSale(false);
      setDueDate("");
      setCheckoutNotes("");

      // Refresh catalog stock
      await fetchCatalog();
      onSaleCompleted?.();
    } catch (err: any) {
      playAudioBeep("error");
      notify.error("Error al procesar venta", err.message || "Revisa los campos e intenta nuevamente.");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // --- INS: Add Misc Item ---
  const handleAddMiscItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!miscName.trim()) {
      notify.warning("Campo requerido", "Indica la descripción del artículo.");
      return;
    }
    const pUsd = parseFloat(miscPriceUSD) || 0;
    const qty = Math.max(1, parseInt(miscQuantity, 10) || 1);
    if (pUsd <= 0) {
      notify.warning("Monto requerido", "Indica un precio de venta mayor a 0.");
      return;
    }

    const pVes = pUsd * bcvRate;
    const miscItem: TicketCartItem = {
      id: `misc-${Date.now()}`,
      product_name: miscName.trim(),
      category: "Varios",
      unit_cost_usd: 0,
      unit_price_usd: pUsd,
      unit_price_ves: pVes,
      quantity: qty,
      available_stock: 9999,
      subtotal_usd: Number((pUsd * qty).toFixed(2)),
      subtotal_ves: Number((pVes * qty).toFixed(2)),
    };

    updateActiveTicket((prev) => ({
      ...prev,
      cart: [...prev.cart, miscItem],
    }));

    playAudioBeep("success");
    notify.success("Artículo agregado", `"${miscItem.product_name}" añadido al ticket.`);
    setOpenMiscModal(false);
    setMiscName("");
    setMiscPriceUSD("");
    setMiscPriceVES("");
    setMiscQuantity("1");
  };

  // --- F9: Price Verifier Scan ---
  const handleVerifierScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = verifierInput.trim().toLowerCase();
    if (!query) return;

    const found = catalog.find(
      (item) =>
        (item.barcode && item.barcode.toLowerCase() === query) ||
        item.product_name.toLowerCase().includes(query)
    );

    if (found) {
      playAudioBeep("success");
      setVerifiedItem(found);
    } else {
      playAudioBeep("error");
      notify.warning("No encontrado", "No existe ningún producto con ese código.");
      setVerifiedItem(null);
    }
  };

  // --- Thermal Receipt Print ---
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col flex-1 gap-3 h-[calc(100vh-5.5rem)] min-h-[600px] select-none">
      {/* 1. TOP HEADER & SHORTCUTS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl md-elevation-1">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20">
            <ScanLine className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                Terminal POS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En Línea
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Tasa BCV: <strong className="text-neutral-900 dark:text-white font-mono">Bs. {bcvRate.toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Center: Action Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSearchModal(true)}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
            title="Buscar producto en catálogo [F10]"
          >
            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
              F10
            </kbd>
            <Search className="size-3.5 text-neutral-500" />
            <span>Buscar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVerifiedItem(null);
              setVerifierInput("");
              setOpenVerifierModal(true);
            }}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
            title="Verificar precio y existencias [F9]"
          >
            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
              F9
            </kbd>
            <Tag className="size-3.5 text-neutral-500" />
            <span>Verificador</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMiscName("");
              setMiscPriceUSD("");
              setMiscPriceVES("");
              setMiscQuantity("1");
              setOpenMiscModal(true);
            }}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
            title="Agregar artículo vario no catalogado [INS]"
          >
            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
              INS
            </kbd>
            <Plus className="size-3.5 text-neutral-500" />
            <span>Art. Vario</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openCustomerDialog}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
            title="Asignar cliente al ticket [F6]"
          >
            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
              F6
            </kbd>
            <User className="size-3.5 text-neutral-500" />
            <span className="max-w-[100px] truncate">{activeTicket.customerName}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openRecentSalesDialog}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
            title="Ver últimas ventas y reimprimir tickets [F4]"
          >
            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
              F4
            </kbd>
            <History className="size-3.5 text-neutral-500" />
            <span>Últimas Ventas</span>
          </Button>
        </div>

        {/* Right: Switch to Admin / Reports */}
        <div className="flex items-center gap-2">
          {onViewAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewAdmin}
              className="h-8 px-3 text-xs font-semibold rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 gap-1.5"
            >
              <FileText className="size-3.5" />
              <span className="hidden sm:inline">Historial & Métricas</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (activeTicket.cart.length === 0) {
                notify.warning("Ticket vacío", "Agrega artículos antes de cobrar.");
                return;
              }
              setOpenCheckoutModal(true);
            }}
            className="h-8 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm gap-1.5"
          >
            <kbd className="px-1 py-0.5 rounded bg-emerald-700 text-[10px] font-mono text-emerald-100">
              F11
            </kbd>
            <DollarSign className="size-3.5" />
            <span>Cobrar</span>
          </Button>
        </div>
      </div>

      {/* 2. MULTI-TICKET TABS BAR */}
      <div className="flex items-center justify-between gap-2 px-1 border-b border-neutral-200 dark:border-neutral-800 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {tickets.map((t) => {
            const isActive = t.id === activeTicketId;
            const itemCount = t.cart.reduce((s, i) => s + i.quantity, 0);
            return (
              <div
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200/80 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800"
                }`}
              >
                <Receipt className="size-3.5 opacity-70" />
                <span>{t.name}</span>
                {itemCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {itemCount}
                  </span>
                )}
                {tickets.length > 1 && (
                  <button
                    onClick={(e) => closeTicket(t.id, e)}
                    className="p-0.5 rounded-md hover:bg-black/20 dark:hover:bg-white/20 transition-colors opacity-60 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={addNewTicket}
            className="h-7 px-2 text-xs font-medium rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 gap-1"
          >
            <Plus className="size-3.5" />
            <span>Nuevo Ticket</span>
          </Button>
        </div>

        {/* Fast stats indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span>
            Cliente: <strong className="text-neutral-800 dark:text-neutral-200">{activeTicket.customerName}</strong>
          </span>
          <span className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
          <span>
            Artículos: <strong className="text-neutral-800 dark:text-neutral-200">{totalItemsCount}</strong>
          </span>
        </div>
      </div>

      {/* 3. BARCODE SCANNER / FAST INPUT BAR */}
      <div className="relative">
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
              <Barcode className="size-5" />
            </div>
            <Input
              ref={barcodeInputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Escanear código de barras o escribir producto... (Ej: 750100 o 3*coca) [ENTER para añadir]"
              className="pl-11 pr-24 h-12 text-sm font-medium rounded-2xl bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 focus-visible:ring-emerald-500 shadow-sm"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 gap-1">
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => setBarcodeInput("")}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="size-4" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                ENTER
              </span>
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 px-5 font-bold rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-sm gap-2"
          >
            <Plus className="size-4" />
            <span>Añadir</span>
          </Button>
        </form>

        {/* Predictive Suggestions Dropdown */}
        {isDropdownOpen && searchSuggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 top-14 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 max-h-80 overflow-y-auto">
            {searchSuggestions.map((item, idx) => {
              const isSelected = idx === selectedSearchIndex;
              return (
                <div
                  key={item.investment_id}
                  onClick={() => {
                    addItemToCart(item, 1);
                    setBarcodeInput("");
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      <Package className="size-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                        {item.product_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {item.barcode && <span className="font-mono">{item.barcode}</span>}
                        {item.category && <span>• {item.category}</span>}
                        <span>• Stock: <strong className={item.available_stock <= 3 ? "text-amber-600" : "text-emerald-600"}>{item.available_stock}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-neutral-900 dark:text-white">
                      ${item.suggested_price_usd.toFixed(2)}
                    </div>
                    <div className="text-xs font-mono text-neutral-500">
                      Bs. {(item.suggested_price_usd * bcvRate).toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. TICKET ITEMS TABLE (CART VIEW) */}
      <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl overflow-hidden flex flex-col md-elevation-1">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Producto / Detalle</div>
          <div className="col-span-2 text-right">Precio Unit.</div>
          <div className="col-span-2 text-center">Cantidad</div>
          <div className="col-span-2 text-right">Subtotal</div>
          <div className="col-span-1 text-center">Acción</div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {activeTicket.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-3">
                <ShoppingCart className="size-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                Ticket Vacío
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                Usa la pistola lectora de código de barras, escribe en la barra superior o presiona{" "}
                <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[10px] font-mono font-bold">F10</kbd>{" "}
                para buscar productos en el catálogo.
              </p>
            </div>
          ) : (
            activeTicket.cart.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors text-sm"
              >
                {/* # Index */}
                <div className="col-span-1 text-center font-mono text-xs text-neutral-400">
                  {index + 1}
                </div>

                {/* Product Info */}
                <div className="col-span-4 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">
                    {item.product_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {item.barcode && <span className="font-mono text-[11px]">{item.barcode}</span>}
                    {item.category && <span>• {item.category}</span>}
                    {item.available_stock < 9999 && (
                      <span className="text-[11px] text-neutral-400">
                        (Stock: {item.available_stock})
                      </span>
                    )}
                  </div>
                </div>

                {/* Unit Price (Editable) */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-neutral-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price_usd}
                      onChange={(e) => updateCartItemPrice(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right font-semibold bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded px-1 py-0.5 border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    Bs. {item.unit_price_ves.toFixed(2)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="col-span-2 flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    className="size-7 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
                  >
                    <Minus className="size-3.5" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={item.available_stock}
                    value={item.quantity}
                    onChange={(e) => updateCartItemQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                    className="w-12 text-center font-bold text-sm bg-neutral-50 dark:bg-neutral-800/80 rounded-lg py-1 border border-neutral-200 dark:border-neutral-700 focus:ring-1 focus:ring-emerald-500"
                  />

                  <button
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    className="size-7 flex items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="col-span-2 text-right">
                  <div className="font-bold text-neutral-900 dark:text-white">
                    ${item.subtotal_usd.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Bs. {item.subtotal_ves.toFixed(2)}
                  </div>
                </div>

                {/* Remove */}
                <div className="col-span-1 text-center">
                  <button
                    onClick={() => removeCartItem(item.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Quitar artículo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. BOTTOM CHECKOUT & SUMMARY BAR */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl md-elevation-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left info & actions */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCurrentTicket}
            disabled={activeTicket.cart.length === 0}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 h-8 px-2.5 rounded-xl"
          >
            <Trash2 className="size-3.5" />
            <span>Limpiar Ticket</span>
          </Button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-500">Descuento ($):</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={activeTicket.discountUSD || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                updateActiveTicket((prev) => ({ ...prev, discountUSD: val }));
              }}
              placeholder="0.00"
              className="w-20 px-2 py-1 text-xs font-bold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-neutral-500">
            <span>Subtotal:</span>
            <strong className="text-neutral-900 dark:text-white font-mono">
              ${ticketSubtotalUSD.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Right: Big Totals & Emit Button */}
        <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Total a Pagar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                ${ticketTotalUSD.toFixed(2)}
              </span>
              <span className="text-base font-bold font-mono text-neutral-500 dark:text-neutral-400">
                ≈ Bs. {ticketTotalVES.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => {
              if (activeTicket.cart.length === 0) {
                notify.warning("Ticket vacío", "Agrega artículos antes de cobrar.");
                return;
              }
              setOpenCheckoutModal(true);
            }}
            disabled={activeTicket.cart.length === 0}
            className="h-14 px-8 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-600/20 gap-3 md-ripple transition-all"
          >
            <DollarSign className="size-5" />
            <div className="text-left leading-tight">
              <div>Cobrar Ticket</div>
              <span className="text-[11px] font-normal opacity-80">[F11] Emitir</span>
            </div>
          </Button>
        </div>
      </div>

      {/* ========================================================
          MODAL: [F11] CHECKOUT & MULTIMONEDA PAYMENT
          ======================================================== */}
      <Dialog open={openCheckoutModal} onOpenChange={setOpenCheckoutModal}>
        <DialogContent className="max-w-xl p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <DollarSign className="size-6 text-emerald-600" />
              Cobrar Ticket #{activeTicket.id}
            </DialogTitle>
            <DialogDescription>
              Selecciona el método de pago, calcula vuelto o emite a crédito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Total Display Header */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total a Cobrar
                </span>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  ${ticketTotalUSD.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-500 font-medium">Equivalente BCV</span>
                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                  Bs. {ticketTotalVES.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Método de Pago Principal
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedPaymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                        isSelected
                          ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 shadow-sm"
                          : "bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Received & Change Calculator (Calculadora de Vuelto) */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Calculator className="size-4 text-neutral-500" />
                  Calculadora de Vuelto / Efectivo Recibido
                </Label>
                {changeDueUSD > 0 && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Vuelto: ${changeDueUSD.toFixed(2)} / Bs. {changeDueVES.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-neutral-500">Monto Recibido ($ USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`$${ticketTotalUSD.toFixed(2)}`}
                    value={amountReceivedUSD}
                    onChange={(e) => handleAmountUSDChange(e.target.value)}
                    className="font-bold text-sm h-10 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-neutral-500">Monto Recibido (Bs. VES)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Bs. ${ticketTotalVES.toFixed(2)}`}
                    value={amountReceivedVES}
                    onChange={(e) => handleAmountVESChange(e.target.value)}
                    className="font-bold text-sm h-10 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Credit Sale Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-neutral-500" />
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Venta a Crédito / Cuenta por Cobrar
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Cliente: <strong>{activeTicket.customerName}</strong>
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isCreditSale}
                onChange={(e) => setIsCreditSale(e.target.checked)}
                className="size-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {isCreditSale && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl">
                <div>
                  <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    Fecha de Vencimiento
                  </Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 rounded-xl mt-1 text-xs"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openCustomerDialog}
                    className="text-xs h-9 rounded-xl mt-4"
                  >
                    Cambiar Cliente [F6]
                  </Button>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs font-medium text-neutral-500">
                Notas / Referencia de Transferencia (Opcional)
              </Label>
              <Input
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder="Ej: Ref #4928, Pago Móvil Banesco"
                className="h-10 rounded-xl mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenCheckoutModal(false)}
              className="rounded-xl"
            >
              Cancelar [ESC]
            </Button>
            <Button
              onClick={handleConfirmCheckout}
              disabled={checkoutSubmitting}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              {checkoutSubmitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              <span>Confirmar y Emitir Ticket</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: THERMAL RECEIPT / TICKET DE VENTA (80mm/58mm)
          ======================================================== */}
      <Dialog open={openReceiptModal} onOpenChange={setOpenReceiptModal}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Printer className="size-5 text-neutral-600" />
                Comprobante de Venta
              </span>
              <span className="text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                {receiptData?.ticket_code || "TKT-000000"}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Printable Ticket Area */}
          <div
            id="printable-receipt"
            className="my-2 p-5 bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl font-mono text-xs text-neutral-800 dark:text-neutral-200 space-y-3"
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-base font-black tracking-tight uppercase">QUÁDRALO POS</h2>
              <p className="text-[11px] text-neutral-500">Comprobante de Entrega</p>
              <p className="text-[10px] text-neutral-400">
                {receiptData ? new Date(receiptData.created_at).toLocaleString("es-VE") : ""}
              </p>
            </div>

            <div className="border-t border-b border-neutral-300 dark:border-neutral-700 py-1.5 space-y-0.5 text-[11px]">
              <div>
                <strong>Ticket:</strong> {receiptData?.ticket_code || "-"}
              </div>
              <div>
                <strong>Cliente:</strong> {receiptData?.customer_name || "Cliente General"}
              </div>
              <div>
                <strong>Método:</strong> {receiptData?.payment_method || "-"}
              </div>
              <div>
                <strong>Tasa BCV:</strong> Bs. {receiptData?.bcv_rate?.toFixed(2) || bcvRate.toFixed(2)}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-[10px] uppercase border-b pb-0.5 border-neutral-200 dark:border-neutral-800">
                <span>Cant x Descrip</span>
                <span>Total ($)</span>
              </div>
              {receiptData?.items && receiptData.items.length > 0 ? (
                receiptData.items.map((item, idx) => {
                  const itemSubtotal =
                    item.subtotal_usd ??
                    item.total_income_usd ??
                    (item.unit_price_usd || 0) * (item.quantity || 1);
                  return (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate pr-2">
                        {item.quantity} x {item.product_name}
                      </span>
                      <span className="font-bold shrink-0">
                        ${(itemSubtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-between text-[11px]">
                  <span>{receiptData?.quantity || 1} x {receiptData?.product_name || "Producto"}</span>
                  <span className="font-bold">${(receiptData?.total_income_usd || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-neutral-300 dark:border-neutral-700 pt-2 space-y-1">
              {receiptData?.discount_usd && receiptData.discount_usd > 0 ? (
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Descuento:</span>
                  <span>-${(receiptData.discount_usd || 0).toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-black">
                <span>TOTAL USD:</span>
                <span>${(receiptData?.total_income_usd || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-neutral-500">
                <span>TOTAL VES:</span>
                <span>Bs. {(receiptData?.total_income_ves || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-400">
              <p>¡Gracias por su compra!</p>
              <p>Conserve este ticket como comprobante.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpenReceiptModal(false)}
              className="rounded-xl"
            >
              Cerrar
            </Button>
            <Button
              onClick={handlePrintReceipt}
              className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold gap-2"
            >
              <Printer className="size-4" />
              <span>Imprimir Ticket</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: [F10] CATALOG PRODUCT SEARCH
          ======================================================== */}
      <Dialog open={openSearchModal} onOpenChange={setOpenSearchModal}>
        <DialogContent className="max-w-2xl p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Search className="size-5 text-neutral-600" />
              Catálogo de Productos [F10]
            </DialogTitle>
            <DialogDescription>
              Busca productos por nombre o código y haz clic para agregarlos al ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Search Input & Category Pills */}
            <div className="space-y-2">
              <Input
                value={catalogFilter}
                onChange={(e) => setCatalogFilter(e.target.value)}
                placeholder="Filtrar por nombre, categoría o código..."
                className="h-11 rounded-xl text-sm"
                autoFocus
              />
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedCategoryFilter === cat
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-2xl">
              {catalog
                .filter((item) => {
                  const matchText =
                    item.product_name.toLowerCase().includes(catalogFilter.toLowerCase()) ||
                    item.barcode?.toLowerCase().includes(catalogFilter.toLowerCase()) ||
                    item.category?.toLowerCase().includes(catalogFilter.toLowerCase());
                  const matchCat =
                    selectedCategoryFilter === "Todas" ||
                    (item.category || "General").toLowerCase() === selectedCategoryFilter.toLowerCase();
                  return matchText && matchCat;
                })
                .map((item) => (
                  <div
                    key={item.investment_id}
                    onClick={() => {
                      addItemToCart(item, 1);
                      setOpenSearchModal(false);
                    }}
                    className="flex items-center justify-between p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                        {item.product_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        {item.barcode && <span className="font-mono">{item.barcode}</span>}
                        {item.category && <span>• {item.category}</span>}
                        <span>• Stock: <strong className={item.available_stock <= 3 ? "text-amber-600" : "text-emerald-600"}>{item.available_stock}</strong></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-neutral-900 dark:text-white">
                        ${item.suggested_price_usd.toFixed(2)}
                      </div>
                      <div className="text-xs font-mono text-neutral-500">
                        Bs. {(item.suggested_price_usd * bcvRate).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: [F9] PRICE & STOCK VERIFIER
          ======================================================== */}
      <Dialog open={openVerifierModal} onOpenChange={setOpenVerifierModal}>
        <DialogContent className="max-w-md p-6 rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2">
              <Tag className="size-5 text-emerald-600" />
              Verificador de Precios [F9]
            </DialogTitle>
            <DialogDescription>
              Escanea el código de un artículo para consultar su precio y existencias al instante sin agregarlo al ticket.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifierScan} className="my-3">
            <Input
              value={verifierInput}
              onChange={(e) => setVerifierInput(e.target.value)}
              placeholder="Escanear código de barras..."
              className="h-12 text-center text-base font-bold rounded-2xl"
              autoFocus
            />
          </form>

          {verifiedItem ? (
            <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
              <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                {verifiedItem.product_name}
              </h4>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ${verifiedItem.suggested_price_usd.toFixed(2)}
              </div>
              <div className="text-sm font-mono text-neutral-500">
                Bs. {(verifiedItem.suggested_price_usd * bcvRate).toFixed(2)}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-xs font-semibold">
                <span>Stock Disponible:</span>
                <strong>{verifiedItem.available_stock} unidades</strong>
              </div>
            </div>
          ) : (
            <div className="p-8 text-neutral-400 text-xs">
              Pasa el lector sobre el producto para verificar su precio en pantalla.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: [INS] MISCELLANEOUS ITEM
          ======================================================== */}
      <Dialog open={openMiscModal} onOpenChange={setOpenMiscModal}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="size-5 text-neutral-600" />
              Artículo Vario [INS]
            </DialogTitle>
            <DialogDescription>
              Agrega un servicio o producto no registrado en inventario.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMiscItem} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-bold">Descripción del Artículo</Label>
              <Input
                value={miscName}
                onChange={(e) => setMiscName(e.target.value)}
                placeholder="Ej: Servicio de instalación, Reparación..."
                className="h-10 rounded-xl mt-1 text-sm"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Precio ($ USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={miscPriceUSD}
                  onChange={(e) => {
                    setMiscPriceUSD(e.target.value);
                    const n = parseFloat(e.target.value);
                    setMiscPriceVES(isNaN(n) ? "" : (n * bcvRate).toFixed(2));
                  }}
                  placeholder="0.00"
                  className="h-10 rounded-xl mt-1 text-sm font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={miscQuantity}
                  onChange={(e) => setMiscQuantity(e.target.value)}
                  className="h-10 rounded-xl mt-1 text-sm font-bold text-center"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenMiscModal(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold"
              >
                Agregar al Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: [F6] CUSTOMER SELECTOR / QUICK CREATION
          ======================================================== */}
      <Dialog open={openCustomerModal} onOpenChange={setOpenCustomerModal}>
        <DialogContent className="max-w-lg p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <User className="size-5 text-neutral-600" />
              Seleccionar Cliente [F6]
            </DialogTitle>
            <DialogDescription>
              Asigna un cliente para registrar la venta o cuenta por cobrar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick Select "Cliente General" */}
            <div
              onClick={() => handleSelectCustomer("Cliente General")}
              className="p-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 rounded-xl cursor-pointer flex items-center justify-between border border-neutral-200 dark:border-neutral-700"
            >
              <div>
                <div className="font-bold text-sm">Cliente General (Contado)</div>
                <div className="text-xs text-neutral-500">Venta rápida sin registro de crédito</div>
              </div>
              <Check className="size-4 text-neutral-400" />
            </div>

            {/* Search list */}
            <div className="space-y-2">
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente por nombre..."
                className="h-9 rounded-xl text-xs"
              />

              <div className="max-h-44 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-xl">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.name, c.id)}
                      className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold">{c.name}</span>
                      {c.phone && <span className="text-neutral-400">{c.phone}</span>}
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick New Customer */}
            <form onSubmit={handleCreateCustomer} className="p-3 border rounded-xl space-y-2 bg-neutral-50/50 dark:bg-neutral-800/30">
              <Label className="text-xs font-bold">Registrar Nuevo Cliente</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Nombre completo"
                  className="h-8 text-xs rounded-lg"
                />
                <Input
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingCustomer || !newCustName.trim()}
                className="w-full h-8 text-xs font-semibold rounded-lg"
              >
                Crear y Asignar
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================
          MODAL: [F4] RECENT SALES & REPRINT
          ======================================================== */}
      <Dialog open={openRecentSalesModal} onOpenChange={setOpenRecentSalesModal}>
        <DialogContent className="max-w-3xl p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <History className="size-5 text-neutral-600" />
              Últimas Ventas Emitidas [F4]
            </DialogTitle>
            <DialogDescription>
              Consulta tickets recientes, reimprime comprobantes o anula ventas con devolución de stock.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-2xl my-2">
            {loadingRecentSales ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                Cargando ventas recientes...
              </div>
            ) : recentSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No hay ventas registradas recientemente.
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {sale.ticket_code || "TKT-S/N"}
                      </span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {sale.customer_name || "Cliente General"}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      {new Date(sale.created_at).toLocaleString("es-VE")} • {sale.payment_method}
                      {sale.items && ` • ${sale.items.length} artículo(s)`}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-black text-sm text-neutral-900 dark:text-white">
                        ${(sale.total_income_usd || 0).toFixed(2)}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">
                        Bs. {(sale.total_income_ves || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReceiptFromSale(sale)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title="Reimprimir Ticket"
                      >
                        <Printer className="size-3.5" />
                        <span className="hidden sm:inline">Ticket</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoidSale(sale)}
                        disabled={deletingSaleId === sale.id}
                        className="h-8 px-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Anular venta y devolver stock"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

