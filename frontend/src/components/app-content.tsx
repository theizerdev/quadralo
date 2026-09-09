import React from "react";
import { cn } from "@/components/ui/card";

export function AppContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6 w-full min-w-0 overflow-x-hidden", className)}>
      {children}
    </main>
  );
}
