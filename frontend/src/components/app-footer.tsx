import React from "react";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200/60 dark:border-neutral-800/60 py-3 px-4 text-xs text-neutral-500 dark:text-neutral-400">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">ADATOV</span>
          <span>© 2026</span>
          <span>•</span>
          <span>Panel de Administración SaaS</span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            API Python Conectada
          </span>
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
