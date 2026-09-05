"use client";

import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "@/components/ui/card";

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

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      onClick={toggleSidebar}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 transition-colors",
        className
      )}
      aria-label="Toggle Sidebar"
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
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
        "flex flex-1 flex-col min-w-0 bg-white dark:bg-neutral-950 transition-[margin] duration-300 ease-in-out",
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
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && openMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setOpenMobile(false)}
        />
      )}

      <aside
        className={cn(
          "bg-neutral-50 dark:bg-neutral-900/70 border-r border-neutral-200/80 dark:border-neutral-800 flex flex-col transition-all duration-200 ease-in-out z-50",
          isMobile
            ? "fixed inset-y-0 left-0 w-64 shadow-2xl"
            : "sticky top-0 h-screen",
          isMobile && !openMobile ? "-translate-x-full" : "translate-x-0",
          !isMobile && (open ? "w-64" : "w-16"),
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
