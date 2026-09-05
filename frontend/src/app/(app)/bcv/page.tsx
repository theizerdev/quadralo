"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import {
  DollarSign,
  Euro,
  Coins,
  Check,
  RefreshCw,
  RotateCcw,
  Building,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  SlidersHorizontal,
} from "lucide-react";

interface RateItem {
  rate: number;
  official_rate?: number;
  is_custom?: boolean;
  custom_rate?: number | null;
  fuente: string;
  fecha?: string | null;
  currency: string;
}

interface UsdtItem {
  rate: number;
  min_price: number;
  max_price: number;
  fuente: string;
  gap_percentage: number;
  currency: string;
}

interface RatesResponse {
  usd_bcv: RateItem;
  eur_bcv: RateItem;
  usdt_p2p: UsdtItem;
}

export default function BCVPage() {
  const [rates, setRates] = useState<RatesResponse | null>(null);
  const [newUsdRate, setNewUsdRate] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showEditUsd, setShowEditUsd] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Quick converter state
  const [calcVes, setCalcVes] = useState<string>("1000");

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const data = await apiFetch<RatesResponse>("/bcv/latest");
      setRates(data);
      setNewUsdRate(data.usd_bcv.rate.toString());
      if (data.usd_bcv.is_custom) {
        setShowEditUsd(true);
      }
    } catch (e) {
      console.error("Error al cargar tasas:", e);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const data = await apiFetch<RatesResponse>("/bcv/sync", { method: "POST" });
      setRates(data);
      if (!data.usd_bcv.is_custom) {
        setNewUsdRate(data.usd_bcv.official_rate?.toString() || "");
      }
      setMessage({
        text: "Tasas sincronizadas en tiempo real desde el BCV y Binance P2P.",
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message || "Error al sincronizar", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateUsd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    try {
      const val = parseFloat(newUsdRate);
      if (val > 0) {
        const res = await apiFetch<RatesResponse>("/bcv/update", {
          method: "POST",
          body: JSON.stringify({ rate: val }),
        });
        setRates(res);
        setMessage({ text: "Tasa manual de USD guardada para tu negocio.", type: "success" });
      }
    } catch (e: any) {
      setMessage({ text: e.message || "Error al guardar la tasa", type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  const handleResetUsd = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const data = await apiFetch<RatesResponse>("/bcv/reset", { method: "POST" });
      setRates(data);
      setNewUsdRate(data.usd_bcv.official_rate?.toString() || "");
      setShowEditUsd(false);
      setMessage({
        text: "Se ha restablecido al Dólar oficial del BCV en tiempo real.",
        type: "success",
      });
    } catch (e: any) {
      setMessage({ text: e.message || "Error al restablecer", type: "error" });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Hoy";
    try {
      return new Date(dateStr).toLocaleDateString("es-VE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Conversor en vivo
  const vesAmount = parseFloat(calcVes) || 0;
  const usdRate = rates?.usd_bcv.rate || 1;
  const eurRate = rates?.eur_bcv.rate || 1;
  const usdtRate = rates?.usdt_p2p.rate || 1;

  const convertedUsd = usdRate > 0 ? (vesAmount / usdRate).toFixed(2) : "0.00";
  const convertedEur = eurRate > 0 ? (vesAmount / eurRate).toFixed(2) : "0.00";
  const convertedUsdt = usdtRate > 0 ? (vesAmount / usdtRate).toFixed(2) : "0.00";

  return (
    <div className="w-full flex flex-1 flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Panel de Tasas de Cambio en Tiempo Real
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Referencias oficiales del Banco Central de Venezuela (USD / EUR) y mercado P2P de USDT.
          </p>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="outline"
          className="gap-2 h-9 self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>Sincronizar Todas</span>
        </Button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Grid: DÓLAR BCV y EURO BCV perfectamente balanceados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* CARD 1: DÓLAR OFICIAL BCV */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between min-h-[250px]">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          {/* Card Top */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {rates?.usd_bcv.is_custom ? "Dólar BCV (Personalizado)" : "Dólar Oficial BCV"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditUsd(!showEditUsd)}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Modificar tasa del negocio"
              >
                <SlidersHorizontal className="size-3" />
                <span>{showEditUsd ? "Ocultar edición" : "Personalizar"}</span>
              </button>

              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <DollarSign className="size-4" />
              </div>
            </div>
          </div>

          {/* Card Center: Rate Display OR Inline Edit Form */}
          <div className="relative z-10 my-3">
            {!showEditUsd ? (
              <>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  Bs. {rates ? rates.usd_bcv.rate.toFixed(2) : "..."}{" "}
                  <span className="text-xs font-normal text-neutral-500">/ USD</span>
                </div>
                {rates?.usd_bcv.is_custom ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                    Tasa oficial BCV en vivo: Bs. {rates.usd_bcv.official_rate?.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    Tasa oficial del Banco Central de Venezuela
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleUpdateUsd} className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Fijar Tasa Manual (USD):
                  </span>
                  {rates?.usd_bcv.is_custom && (
                    <button
                      type="button"
                      onClick={handleResetUsd}
                      disabled={syncing}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="size-3" />
                      <span>Restablecer a Oficial</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-neutral-400 font-semibold">
                      Bs.
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-9 h-9 font-medium text-xs"
                      placeholder="Ej. 807.39"
                      value={newUsdRate}
                      onChange={(e) => setNewUsdRate(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" size="sm" disabled={updating} className="h-9 px-3 text-xs">
                    {updating ? "..." : "Guardar"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="flex items-center gap-1">
              <Building className="size-3 text-neutral-400" />
              <span>{rates?.usd_bcv.fuente || "Banco Central de Venezuela"}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-neutral-400" />
              <span>{formatDate(rates?.usd_bcv.fecha)}</span>
            </span>
          </div>
        </div>

        {/* CARD 2: EURO OFICIAL BCV */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900/60 flex flex-col justify-between min-h-[250px]">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 pointer-events-none" />

          {/* Card Top */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-blue-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Euro Oficial BCV
              </span>
            </div>

            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Euro className="size-4" />
            </div>
          </div>

          {/* Card Center */}
          <div className="relative z-10 my-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Bs. {rates ? rates.eur_bcv.rate.toFixed(2) : "..."}{" "}
              <span className="text-xs font-normal text-neutral-500">/ EUR</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              Paridad Cambiaria: 1 EUR ≈{" "}
              {rates && rates.usd_bcv.rate > 0
                ? (rates.eur_bcv.rate / rates.usd_bcv.rate).toFixed(3)
                : "1.162"}{" "}
              USD
            </p>
          </div>

          {/* Card Footer */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <span className="flex items-center gap-1">
              <Building className="size-3 text-neutral-400" />
              <span>{rates?.eur_bcv.fuente || "Banco Central de Venezuela"}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-neutral-400" />
              <span>{formatDate(rates?.eur_bcv.fecha)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* CARD 3: COMPRA DE USDT (ESPACIO DE 12 COMPLETO A TODO EL ANCHO) */}
      <div className="w-full">
        <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-neutral-900 dark:via-emerald-950/10 dark:to-neutral-900 p-6 sm:p-7 shadow-2xs dark:border-neutral-800">
          <PlaceholderPattern className="absolute inset-0 size-full stroke-emerald-900/5 dark:stroke-emerald-100/5 pointer-events-none" />

          {/* Top Header of USDT Card */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200/70 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-sm shrink-0">
                <Coins className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                    Referencia de Compra USDT (Mercado P2P Venezuela)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    P2P Compra
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Fuente: {rates?.usdt_p2p.fuente || "Binance P2P en Bolívares (VES)"}
                </p>
              </div>
            </div>

            {/* Big Price Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                Bs. {rates ? rates.usdt_p2p.rate.toFixed(2) : "..."}
              </span>
              <span className="text-xs text-neutral-500 font-semibold">/ USDT</span>
            </div>
          </div>

          {/* Key Indicators 3-columns across full width */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Rango de Órdenes P2P
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                Bs. {rates?.usdt_p2p.min_price.toFixed(2)} — Bs. {rates?.usdt_p2p.max_price.toFixed(2)}
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Mejores ofertas activas de compra</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Brecha Cambiaria (Spread vs BCV)
              </div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                <TrendingUp className="size-4" />
                <span>+{rates ? rates.usdt_p2p.gap_percentage.toFixed(2) : "0.00"}%</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Diferencia sobre la tasa oficial del BCV</p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800/80 shadow-2xs">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Tipo de Activo Cripto
              </div>
              <div className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                Tether USD (USDT)
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">1 USDT indexado 1:1 al USD internacional</p>
            </div>
          </div>

          {/* Interactive Quick Converter Tool across full width */}
          <div className="relative z-10 p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="size-4 text-emerald-600" />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                Conversor Rápido en Tiempo Real:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div className="space-y-1">
                <Label htmlFor="calcVesInput" className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  Monto en Bolívares (VES)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">
                    Bs.
                  </span>
                  <Input
                    id="calcVesInput"
                    type="number"
                    className="pl-9 h-10 text-sm font-bold bg-white dark:bg-neutral-900"
                    placeholder="1000"
                    value={calcVes}
                    onChange={(e) => setCalcVes(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center shadow-2xs">
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">Equivalente en USDT</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {convertedUsdt} USDT
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center shadow-2xs">
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">Equivalente Dólar BCV</span>
                <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5 block">
                  ${convertedUsd} USD
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-center shadow-2xs">
                <span className="text-[10px] text-neutral-400 block uppercase font-medium">Equivalente Euro BCV</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                  €{convertedEur} EUR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
