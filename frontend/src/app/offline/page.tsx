"use client";

import React from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-5 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="mx-auto size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <WifiOff className="size-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Sin conexión a Internet
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Quádralo está en modo offline. Puedes seguir navegando por las pantallas cacheadas o presionar reintentar cuando recuperes señal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            <RefreshCw className="size-4" />
            <span>Reintentar Conexión</span>
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-1.5 rounded-xl">
              <ArrowLeft className="size-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-neutral-400">
          Quádralo Progressive Web App · Tus finanzas siempre al día
        </p>
      </div>
    </div>
  );
}
