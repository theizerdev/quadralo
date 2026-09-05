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
    <main className={cn("flex flex-1 flex-col gap-4 p-4 md:p-6", className)}>
      {children}
    </main>
  );
}
