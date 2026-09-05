import React from "react";
import { ShieldCheck, Heart, Circle } from "lucide-react";

export function AdminFooter() {
  return (
    <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">ADATOV SaaS</span>
          <span>© 2026</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Gestión Financiera Bimonetaria (USD / VES)</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Circle className="w-2 h-2 fill-current animate-pulse" />
            <span>Servidor Python En Línea</span>
          </div>

          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Aislamiento SaaS Activo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
