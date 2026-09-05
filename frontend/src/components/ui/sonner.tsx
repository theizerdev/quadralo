"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-neutral-900 group-[.toaster]:border-neutral-200/80 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl dark:group-[.toaster]:bg-neutral-900 dark:group-[.toaster]:text-neutral-100 dark:group-[.toaster]:border-neutral-800 font-sans text-xs sm:text-sm",
          description:
            "group-[.toast]:text-neutral-500 dark:group-[.toast]:text-neutral-400 text-xs",
          actionButton:
            "group-[.toast]:bg-neutral-900 group-[.toast]:text-white dark:group-[.toast]:bg-white dark:group-[.toast]:text-neutral-900 rounded-xl font-medium",
          cancelButton:
            "group-[.toast]:bg-neutral-100 group-[.toast]:text-neutral-500 rounded-xl",
          closeButton:
            "group-[.toast]:bg-neutral-100 dark:group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-500 dark:group-[.toast]:text-neutral-300",
        },
      }}
      {...props}
    />
  );
}
