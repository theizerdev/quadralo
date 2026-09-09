"use client";

import * as React from "react";
import { PanelLeft, Menu, X } from "lucide-react";
import { cn } from "@/components/ui/card";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [openMobile, setOpenMobile] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const pathname = usePathname();

  // Detección reactiva de pantalla móvil/tablet (< 1024px, breakpoint 'lg')
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setOpenMobile(false);
      }
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Cierre automático del drawer móvil al cambiar de ruta
  React.useEffect(() => {
    setOpenMobile(false);
  }, [pathname]);

  // Cierre al pulsar tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openMobile) {
        setOpenMobile(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openMobile]);

  // Bloqueo de scroll en body cuando el drawer móvil está abierto
  React.useEffect(() => {
    if (isMobile && openMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, openMobile]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        toggleSidebar,
        isMobile,
        openMobile,
        setOpenMobile,
      }}
    >
      <div className="flex min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer",
        className
      )}
      aria-label="Abrir o cerrar menú lateral"
      {...props}
    >
      {/* Icono para móvil/tablet: Hamburguesa */}
      <Menu className="size-5 lg:hidden" />
      {/* Icono para escritorio: PanelLeft */}
      <PanelLeft className="size-4 hidden lg:block" />
    </button>
  );
}

export function SidebarCloseTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpenMobile } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setOpenMobile(false)}
      className={cn(
        "lg:hidden inline-flex size-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors focus-visible:outline-none cursor-pointer",
        className
      )}
      aria-label="Cerrar menú lateral"
      {...props}
    >
      <X className="size-5" />
    </button>
  );
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col min-w-0 w-full bg-white dark:bg-neutral-950",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden",
          openMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpenMobile(false)}
        aria-hidden="true"
      />

      {/* Espacio reservado en el flujo del layout para escritorio (Desktop placeholder) */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-300 ease-in-out",
          open ? "w-64" : "w-16"
        )}
        aria-hidden="true"
      />

      {/* Barra Lateral / Drawer fijo al viewport */}
      <aside
        className={cn(
          // Estilo base
          "bg-neutral-50 dark:bg-neutral-900/95 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col transition-all duration-300 ease-in-out select-none",
          // Móvil & Tablet (< 1024px / < lg): Drawer off-canvas flotante
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl lg:shadow-none",
          openMobile ? "translate-x-0" : "-translate-x-full",
          // Escritorio (>= 1024px / lg): Fijo al viewport permanente, nunca se desplaza con el scroll
          "lg:fixed lg:top-0 lg:bottom-0 lg:left-0 lg:translate-x-0 lg:h-screen lg:h-dvh lg:z-30",
          open ? "lg:w-64" : "lg:w-16",
          className
        )}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-14 items-center px-4 border-b border-neutral-200/70 dark:border-neutral-800/70", className)}>
      {children}
    </div>
  );
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4", className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-2 border-t border-neutral-200/70 dark:border-neutral-800/70 mt-auto", className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function SidebarGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, isMobile } = useSidebar();
  if (!open && !isMobile) return null;

  return (
    <div className={cn("px-2 py-1.5 text-[11px] font-medium tracking-wider uppercase text-neutral-400 dark:text-neutral-500", className)}>
      {children}
    </div>
  );
}
