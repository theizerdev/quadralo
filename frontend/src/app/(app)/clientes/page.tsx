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
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  CreditCard,
  History,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Receipt,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface CustomerSummaryItem {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  total_purchases_count: number;
  total_spent_usd: number;
  total_spent_ves: number;
  total_paid_usd: number;
  total_debt_usd: number;
  total_debt_ves: number;
  has_debt: boolean;
  last_sale_date?: string | null;
}

interface CustomersSummaryKPIs {
  total_customers: number;
  debtors_count: number;
  up_to_date_count: number;
  total_receivable_usd: number;
  total_receivable_ves: number;
  total_collected_usd: number;
  total_collected_ves: number;
  collection_rate_percent: number;
  current_bcv_rate: number;
}

interface CustomerListResponse {
  items: CustomerSummaryItem[];
  kpis: CustomersSummaryKPIs;
}

interface SalePayment {
  id: string;
  sale_id: string;
  amount_usd: number;
  amount_ves: number;
  bcv_rate: number;
  payment_method: string;
  notes?: string | null;
  created_at: string;
}

interface CustomerSaleItem {
  id: string;
  product_name: string;
  category?: string | null;
  quantity: number;
  unit_price_usd: number;
  total_income_usd: number;
  total_income_ves: number;
  payment_status: string;
  paid_amount_usd: number;
  debt_amount_usd: number;
  debt_amount_ves: number;
  payment_method?: string | null;
  bcv_rate: number;
  created_at: string;
  payments?: SalePayment[];
}

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerListResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "debtors" | "up_to_date">("all");

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);

  // Cliente seleccionado
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryItem | null>(null);
  const [customerSales, setCustomerSales] = useState<CustomerSaleItem[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Formulario Nuevo/Editar Cliente
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Recordatorio WhatsApp
  const [reminderData, setReminderData] = useState<{
    url: string;
    message: string;
    clean_phone: string;
  } | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(false);

  // Formulario Abono Rápido
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [abonoAmountUsd, setAbonoAmountUsd] = useState<string>("");
  const [abonoPaymentMethod, setAbonoPaymentMethod] = useState<string>("Pago Móvil");
  const [abonoNotes, setAbonoNotes] = useState<string>("");
  const [submittingAbono, setSubmittingAbono] = useState(false);

  // Cargar Clientes y KPIs
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<CustomerListResponse>(
        `/customers?filter_debt=${tabFilter}&search=${encodeURIComponent(searchQuery)}`
      );
      setData(res);
    } catch (err: any) {
      notify.error("Error al cargar clientes", err.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [tabFilter]);

  // Manejo de búsqueda con debounce manual
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormNotes("");
    setIsNewModalOpen(true);
  };

  // Crear Cliente
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      notify.error("Nombre requerido", "Ingresa el nombre del cliente.");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });
      notify.success("Cliente registrado", `${formName} se agregó al directorio correctamente.`);
      setIsNewModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      notify.error("Error al guardar cliente", err.message || "Verifica los datos ingresados.");
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal Editar
  const handleOpenEdit = (customer: CustomerSummaryItem) => {
    setSelectedCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || "");
    setFormEmail(customer.email || "");
    setFormAddress(customer.address || "");
    setFormNotes(customer.notes || "");
    setIsEditModalOpen(true);
  };

  // Guardar Edición
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!formName.trim()) {
      notify.error("Nombre requerido", "Ingresa el nombre del cliente.");
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch(`/customers/${selectedCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          address: formAddress.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });
      notify.success("Cliente actualizado", "Los datos fueron guardados exitosamente.");
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      notify.error("Error al actualizar", err.message || "No se pudo guardar los cambios.");
    } finally {
      setSubmitting(false);
    }
  };

  // Abrir Modal Eliminar
  const handleOpenDelete = (customer: CustomerSummaryItem) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Eliminar Cliente
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      setSubmitting(true);
      await apiFetch(`/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });
      notify.success("Cliente eliminado", "El cliente fue removido de tu directorio.");
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      notify.error("Error al eliminar", err.message || "No se pudo eliminar el cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cargar Historial de Compras de un Cliente
  const handleOpenHistory = async (customer: CustomerSummaryItem) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setLoadingSales(true);
    try {
      const sales = await apiFetch<CustomerSaleItem[]>(`/customers/${customer.id}/sales`);
      setCustomerSales(sales);
    } catch (err: any) {
      notify.error("Error al cargar ventas", err.message || "No se pudo obtener el historial.");
      setCustomerSales([]);
    } finally {
      setLoadingSales(false);
    }
  };

  // Abrir Recordatorio por WhatsApp
  const handleOpenWhatsAppReminder = async (customer: CustomerSummaryItem) => {
    setSelectedCustomer(customer);
    if (!customer.phone || customer.phone.replace(/\D/g, "").length < 7) {
      notify.warning(
        "Teléfono no configurado",
        "El cliente no tiene un número de teléfono válido registrado. Edita sus datos para agregarlo."
      );
      handleOpenEdit(customer);
      return;
    }

    setLoadingReminder(true);
    setIsReminderModalOpen(true);
    try {
      const res = await apiFetch<{
        url: string;
        message: string;
        clean_phone: string;
        customer_name: string;
        total_debt_usd: number;
        total_debt_ves: number;
      }>(`/customers/${customer.id}/whatsapp-reminder`);
      setReminderData(res);
    } catch (err: any) {
      notify.error("Error al generar recordatorio", err.message || "No se pudo preparar el mensaje.");
      setIsReminderModalOpen(false);
    } finally {
      setLoadingReminder(false);
    }
  };

  // Abrir Modal de Abono
  const handleOpenAbono = async (customer: CustomerSummaryItem) => {
    setSelectedCustomer(customer);
    setAbonoAmountUsd("");
    setAbonoPaymentMethod("Pago Móvil");
    setAbonoNotes("");
    setIsAbonoModalOpen(true);
    setLoadingSales(true);

    try {
      const sales = await apiFetch<CustomerSaleItem[]>(`/customers/${customer.id}/sales`);
      setCustomerSales(sales);
      // Preseleccionar la venta más antigua con saldo deudor
      const pendingSale = sales.find((s) => s.debt_amount_usd > 0.01);
      if (pendingSale) {
        setSelectedSaleId(pendingSale.id);
        setAbonoAmountUsd(pendingSale.debt_amount_usd.toString());
      } else {
        setSelectedSaleId("");
      }
    } catch (err: any) {
      notify.error("Error al consultar ventas", err.message);
    } finally {
      setLoadingSales(false);
    }
  };

  // Registrar Abono
  const handleRegisterAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId) {
      notify.error("Selecciona una venta", "Elige la venta pendiente a la cual aplicar el abono.");
      return;
    }
    const amount = parseFloat(abonoAmountUsd);
    if (isNaN(amount) || amount <= 0) {
      notify.error("Monto inválido", "Ingresa un monto de abono mayor a 0.");
      return;
    }

    try {
      setSubmittingAbono(true);
      await apiFetch(`/sales/${selectedSaleId}/payments`, {
        method: "POST",
        body: JSON.stringify({
          amount_usd: amount,
          payment_method: abonoPaymentMethod,
          notes: abonoNotes.trim() || "Abono desde gestión de cobranzas",
        }),
      });
      notify.success("¡Abono registrado!", `Se aplicaron $${amount.toFixed(2)} al saldo deudor.`);
      setIsAbonoModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      notify.error("Error al registrar abono", err.message || "No se pudo procesar el pago.");
    } finally {
      setSubmittingAbono(false);
    }
  };

  // Copiar mensaje al portapapeles
  const handleCopyReminder = () => {
    if (reminderData?.message) {
      navigator.clipboard.writeText(reminderData.message);
      notify.success("Copiado", "Mensaje copiado al portapapeles.");
    }
  };

  const kpis = data?.kpis;
  const customers = data?.items || [];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="size-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Directorio de Clientes & Cobranzas
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Control de compras históricas, saldos deudores y recordatorios amigables por WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={loading}
            className="h-9 gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
          >
            <Plus className="size-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* KPIS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clientes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Clientes</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {kpis?.total_customers ?? 0}
            </span>
            <span className="text-xs text-neutral-400">registrados</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            {kpis?.up_to_date_count ?? 0} al día · {kpis?.debtors_count ?? 0} con saldo
          </p>
        </div>

        {/* Clientes con Deuda */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-200/60 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Clientes con Saldo</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {kpis?.debtors_count ?? 0}
            </span>
            <span className="text-xs text-amber-600/80 dark:text-amber-400/80">
              {kpis && kpis.total_customers > 0
                ? `${Math.round((kpis.debtors_count / kpis.total_customers) * 100)}% de tu cartera`
                : "0%"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Pendientes por pagar o crédito activo
          </p>
        </div>

        {/* Total por Cobrar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-rose-200/60 dark:border-rose-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Total por Cobrar</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              ${kpis ? kpis.total_receivable_usd.toFixed(2) : "0.00"}
            </span>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              ≈ Bs. {kpis ? kpis.total_receivable_ves.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Tasa BCV ref: {kpis?.current_bcv_rate?.toFixed(2) || "36.00"} Bs/$
          </p>
        </div>

        {/* Tasa de Cobranza */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Tasa de Cobranza</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis ? `${kpis.collection_rate_percent.toFixed(1)}%` : "100%"}
            </span>
            <span className="text-xs text-neutral-400">recaudado</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-500">
            Cobrado: ${kpis ? kpis.total_collected_usd.toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
        {/* TABS */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setTabFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tabFilter === "all"
                ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-semibold"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Todos ({kpis?.total_customers ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter("debtors")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              tabFilter === "debtors"
                ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 shadow-sm font-semibold border border-rose-200 dark:border-rose-900"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="size-2 rounded-full bg-rose-500 inline-block"></span>
            Cuentas por Cobrar ({kpis?.debtors_count ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTabFilter("up_to_date")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              tabFilter === "up_to_date"
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold border border-emerald-200 dark:border-emerald-900"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span className="size-2 rounded-full bg-emerald-500 inline-block"></span>
            Al Día ({kpis?.up_to_date_count ?? 0})
          </button>
        </div>

        {/* SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <div className="relative w-full">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
          <Button type="submit" size="sm" variant="ghost" className="h-9 px-3 text-xs">
            Buscar
          </Button>
        </form>
      </div>

      {/* CUSTOMERS LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
          <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <p className="mt-3 text-xs text-neutral-500">Cargando directorio de clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
          <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-3">
            <Users className="size-8" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            No se encontraron clientes
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-sm">
            {tabFilter === "debtors"
              ? "¡Excelente! No tienes clientes con deudas pendientes en este momento."
              : searchQuery
              ? `No hubo resultados para la búsqueda "${searchQuery}".`
              : "Registra tu primer cliente o regístralo automáticamente al crear una nueva venta."}
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="mt-4 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="size-4 mr-1.5" />
            Registrar Cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c) => {
            const hasDebt = c.total_debt_usd > 0.01;
            return (
              <div
                key={c.id}
                className={`flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900 border transition-all duration-200 hover:shadow-md ${
                  hasDebt
                    ? "border-rose-200/80 dark:border-rose-900/50 shadow-sm"
                    : "border-neutral-200/80 dark:border-neutral-800"
                }`}
              >
                <div>
                  {/* TOP ROW: Name, Avatar, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-11 rounded-xl flex items-center justify-center font-bold text-sm select-none ${
                          hasDebt
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                          {c.name}
                        </h3>
                        {c.phone ? (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-500">
                            <Phone className="size-3 text-neutral-400" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">Sin teléfono</span>
                        )}
                      </div>
                    </div>

                    {/* STATUS BADGE */}
                    {hasDebt ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900 shrink-0">
                        Debe ${c.total_debt_usd.toFixed(2)}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 shrink-0">
                        Al día
                      </span>
                    )}
                  </div>

                  {/* DETAILS (EMAIL, ADDRESS, NOTES) */}
                  {(c.email || c.address || c.notes) && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 space-y-1 text-xs text-neutral-500">
                      {c.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="size-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="size-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 truncate italic">
                          <FileText className="size-3 shrink-0" />
                          <span className="truncate">{c.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FINANCIAL SUMMARY METRICS */}
                  <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/80 text-center">
                    <div>
                      <span className="block text-[10px] text-neutral-400 font-medium uppercase">Comprado</span>
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        ${c.total_spent_usd.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-neutral-400">{c.total_purchases_count} compras</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400 font-medium uppercase">Pagado</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ${c.total_paid_usd.toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {c.total_spent_usd > 0
                          ? `${Math.round((c.total_paid_usd / c.total_spent_usd) * 100)}%`
                          : "100%"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-neutral-400 font-medium uppercase">Saldo Pend.</span>
                      <span
                        className={`text-xs font-bold ${
                          hasDebt ? "text-rose-600 dark:text-rose-400" : "text-neutral-500"
                        }`}
                      >
                        ${c.total_debt_usd.toFixed(2)}
                      </span>
                      {hasDebt && (
                        <span className="block text-[10px] text-rose-500/80 truncate">
                          ≈ Bs. {c.total_debt_ves.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BUTTONS */}
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* BOTON RECORDATORIO WHATSAPP (SI DEBE) */}
                    {hasDebt ? (
                      <Button
                        size="sm"
                        onClick={() => handleOpenWhatsAppReminder(c)}
                        className="flex-1 h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                      >
                        <Send className="size-3" />
                        Recordar WhatsApp
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenHistory(c)}
                        className="flex-1 h-8 text-xs gap-1.5 border-neutral-200 dark:border-neutral-800"
                      >
                        <History className="size-3 text-neutral-500" />
                        Ver Historial ({c.total_purchases_count})
                      </Button>
                    )}

                    {/* BOTÓN ABONAR (SI DEBE) */}
                    {hasDebt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAbono(c)}
                        className="h-8 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
                      >
                        <CreditCard className="size-3" />
                        Abonar
                      </Button>
                    )}
                  </div>

                  {/* SECONDARY ROW ACTIONS */}
                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    {hasDebt && (
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(c)}
                        className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                      >
                        <History className="size-3" />
                        Historial ({c.total_purchases_count})
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Editar cliente"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(c)}
                        className="p-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO CLIENTE                                      */}
      {/* ========================================================= */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="size-5 text-emerald-600" />
              Nuevo Cliente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registra un nuevo contacto en tu directorio para asociarlo a tus ventas y cobranzas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-medium">Nombre completo o Empresa *</Label>
              <Input
                required
                placeholder="Ej. Carlos Mendoza"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Teléfono / WhatsApp</Label>
              <Input
                placeholder="Ej. 04121234567 o +58 424 1234567"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Necesario para enviar recordatorios automáticos por WhatsApp con 1 clic.
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium">Correo Electrónico (Opcional)</Label>
              <Input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Dirección / Ubicación (Opcional)</Label>
              <Input
                placeholder="Ciudad, zona o dirección de entrega"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Notas adicionales (Opcional)</Label>
              <Input
                placeholder="Preferencias de pago, días de cobro, etc."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewModalOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submitting ? "Guardando..." : "Guardar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: EDITAR CLIENTE                                     */}
      {/* ========================================================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="size-4 text-emerald-600" />
              Editar Cliente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modifica los datos de contacto o notas de {selectedCustomer?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCustomer} className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-medium">Nombre completo *</Label>
              <Input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Teléfono / WhatsApp</Label>
              <Input
                placeholder="0412... o 58412..."
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Correo Electrónico</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Dirección</Label>
              <Input
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-medium">Notas</Label>
              <Input
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submitting ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: ELIMINAR CLIENTE                                   */}
      {/* ========================================================= */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600">
              <Trash2 className="size-5" />
              ¿Eliminar Cliente?
            </DialogTitle>
            <DialogDescription className="text-xs">
              ¿Estás seguro de que deseas eliminar a <strong>{selectedCustomer?.name}</strong>?
              {selectedCustomer && selectedCustomer.total_purchases_count > 0 && (
                <span className="block mt-1 text-neutral-500">
                  Sus {selectedCustomer.total_purchases_count} ventas históricas permanecerán intactas en tus registros.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteCustomer}
              disabled={submitting}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              {submitting ? "Eliminando..." : "Sí, Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: RECORDATORIO POR WHATSAPP (1-CLIC)                 */}
      {/* ========================================================= */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-emerald-600">
              <Send className="size-4" />
              Recordatorio de Cobro por WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mensaje cordial y personalizado con el desglose en USD y Bolívares a la tasa oficial del BCV.
            </DialogDescription>
          </DialogHeader>

          {loadingReminder ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="mt-2 text-xs text-neutral-500">Generando mensaje personalizado...</p>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed relative group">
                {reminderData?.message}
                <button
                  type="button"
                  onClick={handleCopyReminder}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-700 shadow-sm"
                  title="Copiar texto"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Destinatario: +{reminderData?.clean_phone}</span>
                <span>Tasa BCV del día incluida</span>
              </div>

              <DialogFooter className="pt-2 flex sm:justify-between items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="text-xs"
                >
                  Cerrar
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReminder}
                    className="text-xs gap-1"
                  >
                    <Copy className="size-3" />
                    Copiar
                  </Button>

                  <a
                    href={reminderData?.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsReminderModalOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <Send className="size-3.5" />
                    Abrir WhatsApp
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR ABONO A CLIENTE                          */}
      {/* ========================================================= */}
      <Dialog open={isAbonoModalOpen} onOpenChange={setIsAbonoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-rose-600">
              <CreditCard className="size-4" />
              Registrar Abono / Pago de Deuda
            </DialogTitle>
            <DialogDescription className="text-xs">
              Aplica un cobro para amortizar la deuda de <strong>{selectedCustomer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {loadingSales ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              <p className="mt-2 text-xs text-neutral-500">Buscando ventas con saldo...</p>
            </div>
          ) : (
            <form onSubmit={handleRegisterAbono} className="space-y-3.5 py-2">
              <div>
                <Label className="text-xs font-medium">Venta a abonar *</Label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => {
                    setSelectedSaleId(e.target.value);
                    const s = customerSales.find((item) => item.id === e.target.value);
                    if (s) {
                      setAbonoAmountUsd(s.debt_amount_usd.toString());
                    }
                  }}
                  className="mt-1 w-full h-9 px-3 rounded-lg text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                >
                  {customerSales
                    .filter((s) => s.debt_amount_usd > 0.01)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.product_name} · Restan ${s.debt_amount_usd.toFixed(2)} (Bs. {s.debt_amount_ves.toFixed(2)})
                      </option>
                    ))}
                  {customerSales.filter((s) => s.debt_amount_usd > 0.01).length === 0 && (
                    <option value="">No hay ventas pendientes por cobrar</option>
                  )}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium">Monto del Abono en USD ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  value={abonoAmountUsd}
                  onChange={(e) => setAbonoAmountUsd(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
                {kpis && abonoAmountUsd && !isNaN(parseFloat(abonoAmountUsd)) && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Equivalente en Bolívares: Bs. {(parseFloat(abonoAmountUsd) * kpis.current_bcv_rate).toFixed(2)} (Tasa {kpis.current_bcv_rate.toFixed(2)})
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium">Método de Pago</Label>
                <select
                  value={abonoPaymentMethod}
                  onChange={(e) => setAbonoPaymentMethod(e.target.value)}
                  className="mt-1 w-full h-9 px-3 rounded-lg text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Efectivo USD">Efectivo USD ($)</option>
                  <option value="Efectivo VES">Efectivo VES (Bs)</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Binance Pay / USDT">Binance Pay / USDT</option>
                  <option value="Punto de Venta">Punto de Venta / Tarjeta</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium">Nota o Referencia (Opcional)</Label>
                <Input
                  placeholder="Ej. Ref #4589 o Abono parcial acordado"
                  value={abonoNotes}
                  onChange={(e) => setAbonoNotes(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAbonoModalOpen(false)}
                  disabled={submittingAbono}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAbono || !selectedSaleId}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submittingAbono ? "Procesando..." : "Confirmar Abono"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL: HISTORIAL DE COMPRAS DEL CLIENTE                   */}
      {/* ========================================================= */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-emerald-600" />
              Historial de Compras de {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Todas las ventas registradas asociadas a este cliente y el estado de sus abonos.
            </DialogDescription>
          </DialogHeader>

          {loadingSales ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="size-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="mt-2 text-xs text-neutral-500">Cargando ventas...</p>
            </div>
          ) : customerSales.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No hay compras registradas para este cliente todavía.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1 py-1">
              {customerSales.map((s) => {
                const isPaid = s.payment_status === "paid" || s.debt_amount_usd <= 0.01;
                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {s.product_name}
                          </span>
                          {s.category && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                              {s.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(s.created_at).toLocaleDateString("es-VE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {s.quantity} unids a ${s.unit_price_usd.toFixed(2)}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {isPaid ? "Totalmente Pagado" : `Resta $${s.debt_amount_usd.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-200/60 dark:border-neutral-800/80 text-neutral-500">
                      <span>Total venta: ${s.total_income_usd.toFixed(2)}</span>
                      <span>Abonado: ${s.paid_amount_usd.toFixed(2)}</span>
                      <span>Método: {s.payment_method || "Pago Móvil"}</span>
                    </div>

                    {/* ABONOS PARCIALES */}
                    {s.payments && s.payments.length > 0 && (
                      <div className="mt-1 pt-1.5 border-t border-neutral-200/40 dark:border-neutral-800/40">
                        <span className="text-[10px] font-semibold text-neutral-400 block mb-1">
                          Comprobantes de Abono ({s.payments.length}):
                        </span>
                        <div className="space-y-1">
                          {s.payments.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between text-[10px] text-neutral-500 px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                            >
                              <span>
                                {new Date(p.created_at).toLocaleDateString("es-VE")} · {p.payment_method}
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                +${p.amount_usd.toFixed(2)} (Bs. {p.amount_ves.toFixed(2)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
