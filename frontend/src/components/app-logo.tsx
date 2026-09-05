import React from "react";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";

export function QuadraloCubeIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <g transform="translate(24, 24)">
        {/* Isometric Cube Faces */}
        {/* Top Face */}
        <path d="M0 -17 L15 -8 L0 1 L-15 -8 Z" fill="url(#cubeTop)" />
        <path d="M0 -12 L8 -7.5 L0 -3 L-8 -7.5 Z" fill="#0B132B" fillOpacity="0.85" />

        {/* Left Face */}
        <path d="M-15 -8 L0 1 L0 17 L-15 8 Z" fill="url(#cubeLeft)" />
        <path d="M-11 -5.5 L-4 -1.5 L-4 11.5 L-11 7.5 Z" fill="#0B132B" fillOpacity="0.8" />
        <path d="M-7 -3.5 L-4 -1.5 L-4 8.5 L-7 6.5 Z" fill="url(#cubeTop)" opacity="0.9" />

        {/* Right Face */}
        <path d="M0 1 L15 -8 L15 8 L0 17 Z" fill="url(#cubeRight)" />
        <path d="M4 -1.5 L11 -5.5 L11 7.5 L4 11.5 Z" fill="#0B132B" fillOpacity="0.8" />
        <path d="M4 -1.5 L7 -3.5 L7 6.5 L4 8.5 Z" fill="url(#cubeLeft)" opacity="0.9" />

        {/* Balance Core */}
        <path d="M0 -3 L5 0 L0 3 L-5 0 Z" fill="#6EE7B7" />
      </g>
    </svg>
  );
}

export function AppLogo({ name = "Quádralo" }: { name?: string }) {
  const { open, isMobile } = useSidebar();
  const showText = open || isMobile;

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 overflow-hidden group"
      title="Quádralo - Tus finanzas siempre al día"
    >
      {/* Mini Menu / Isotipo de Precisión Isométrica */}
      <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[#090D16] text-white shadow-md shrink-0 border border-emerald-500/20 transition-all duration-200 group-hover:scale-105 group-hover:border-emerald-400/50 group-hover:shadow-emerald-500/20 group-hover:shadow-lg">
        <QuadraloCubeIcon className="size-6 drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]" />
      </div>

      {showText && (
        <div className="grid flex-1 text-left leading-tight transition-opacity duration-200">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
              {name}
            </span>
            <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <span className="truncate text-[10px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400">
            Tus finanzas siempre al día
          </span>
        </div>
      )}
    </Link>
  );
}
