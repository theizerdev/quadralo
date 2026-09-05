"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  Coins,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { QuadraloCubeIcon } from "@/components/app-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ========================================================================= */}
      {/* LADO IZQUIERDO: IMAGEN CORPORATIVA & EXPERIENCIA DEL EMPRENDEDOR           */}
      {/* ========================================================================= */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between p-10 xl:p-14 overflow-hidden bg-neutral-950 text-white">
        {/* Imagen de fondo del emprendedor */}
        <Image
          src="/login_hero.jpg"
          alt="Emprendedor cuadrando cuentas e inversiones en Quádralo"
          fill
          priority
          sizes="(min-width: 1024px) 54vw, 100vw"
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out hover:scale-100"
        />

        {/* Gradientes oscuros y viñeta para máxima legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40 z-10" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-neutral-950/30 to-neutral-950/80 z-10" />

        {/* Encabezado Superior: Brand Logo */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-900/90 text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-md transition-all duration-200 group-hover:scale-105 group-hover:border-emerald-400">
              <QuadraloCubeIcon className="size-6 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Quádralo
                </span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 tracking-wide block">
                Tus finanzas siempre al día
              </span>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-emerald-300 border border-white/15">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>SaaS para Emprendedores</span>
          </div>
        </div>

        {/* Centro / Parte Inferior: Mensaje Corporativo y Tarjetas de Valor */}
        <div className="relative z-20 my-auto py-10 max-w-xl space-y-6">
          <div className="space-y-3">
            <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              Control total en Bolívares y Dólares
            </div>
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight text-white leading-tight">
              ¿Cuadran tus números al final del día?
            </h2>
            <p className="text-sm xl:text-base text-neutral-200/90 leading-relaxed">
              Diseñado para el comerciante que compra en Bolívares, vende a crédito o contado y necesita saber con certeza su <strong>ganancia neta real</strong> sin sorpresas por la tasa de cambio.
            </p>
          </div>

          {/* 3 Pilares Corporativos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-neutral-900/80 backdrop-blur-md p-3.5 border border-white/10 shadow-lg">
              <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <Wallet className="size-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Inversión y Fletes</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Prorrateo exacto de envíos y costo unitario real.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-900/80 backdrop-blur-md p-3.5 border border-white/10 shadow-lg">
              <div className="size-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                <TrendingUp className="size-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Ganancia Neta</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Deducción de costo COGS en cada venta en tiempo real.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-900/80 backdrop-blur-md p-3.5 border border-white/10 shadow-lg">
              <div className="size-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                <Coins className="size-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Tasa BCV en Vivo</h4>
              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                Conversión automática en USD ($) y VES (Bs.).
              </p>
            </div>
          </div>

          {/* Testimonio de Comerciante */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-neutral-900/80 backdrop-blur-md border border-emerald-500/30 flex items-start gap-3">
            <div className="size-8 rounded-full bg-emerald-500 text-neutral-950 font-bold flex items-center justify-center shrink-0 text-xs">
              ME
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-neutral-200 italic leading-snug">
                «Con Quádralo supe exactamente cuánto estaba ganando en cada producto. Cuadrar la caja ahora es cuestión de segundos.»
              </p>
              <p className="text-[11px] font-semibold text-emerald-400">
                María Elena G. — Emprendedora Textil
              </p>
            </div>
          </div>
        </div>

        {/* Footer del Panel Izquierdo */}
        <div className="relative z-20 flex items-center justify-between text-xs text-neutral-400 pt-4 border-t border-white/10">
          <span>Quádralo © 2026</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="size-3.5" />
            <span>Fintech Bimonetaria Segura</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LADO DERECHO: CONTENEDOR DINÁMICO DE FORMULARIOS                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto">
        {/* Mobile Header (Solo visible en pantallas pequeñas) */}
        <div className="flex items-center justify-between lg:hidden pb-5 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#090D16] text-white border border-emerald-500/30 shadow-md">
              <QuadraloCubeIcon className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-white block">
                Quádralo
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                Tus finanzas siempre al día
              </span>
            </div>
          </Link>

          {pathname === "/login" && (
            <Link href="/register" className="text-xs font-semibold text-emerald-600 hover:underline">
              Crear cuenta →
            </Link>
          )}
          {pathname === "/register" && (
            <Link href="/login" className="text-xs font-semibold text-emerald-600 hover:underline">
              Iniciar sesión →
            </Link>
          )}
        </div>

        {/* Contenedor del Formulario Activo */}
        <div className="my-auto max-w-md w-full mx-auto py-4">
          {children}
        </div>

        {/* Footer del Panel Derecho */}
        <div className="pt-6 text-center text-xs text-neutral-400 border-t border-neutral-200/60 dark:border-neutral-800/60 max-w-md w-full mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Seguridad SSL 256-bit</span>
          </span>
          <span>Versión 1.0.0</span>
        </div>
      </div>
    </div>
  );
}
