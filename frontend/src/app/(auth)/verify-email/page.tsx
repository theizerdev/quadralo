"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, AuthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const { login } = useAuth();
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\D/g, "");
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    if (cleanCode.length !== 8) {
      setError("Por favor ingresa la clave completa de 8 dígitos numéricos.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      login(data);
    } catch (err: any) {
      setError(err.message || "Clave de verificación incorrecta o expirada.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Ingresa tu correo para poder reenviar el código.");
      return;
    }

    setError(null);
    setResending(true);
    try {
      const res = await apiFetch<{ message: string; reset_code?: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setInfoMsg(res.message || "Nuevo código de verificación enviado a tu correo.");
      if (res.reset_code) {
        setDevCode(res.reset_code);
      }
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar el código. Intenta de nuevo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="size-3.5" />
          <span>Verificación de Cuenta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Verificar Correo Electrónico
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Ingresa la clave de 8 dígitos recibida en tu bandeja de entrada para activar tu cuenta de Quádralo.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      {/* Info */}
      {infoMsg && !error && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs sm:text-sm border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>{infoMsg}</div>
        </div>
      )}

      {/* Dev Mode Code */}
      {devCode && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Código de prueba: <strong className="font-mono font-bold tracking-widest">{devCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setCode(devCode)}
            className="px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-800 text-[11px] font-bold hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Autocompletar
          </button>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleVerify} className="space-y-4">
        {/* Correo */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Correo Electrónico Registrado
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
            <Input
              id="email"
              type="email"
              placeholder="tu@negocio.com"
              className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Código de 8 dígitos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="code" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Clave de 8 Dígitos Numéricos
            </Label>
            <span className="text-[11px] font-mono text-neutral-400">
              {code.length}/8 dígitos
            </span>
          </div>

          <div className="relative">
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="12345678"
              className="h-14 text-center font-mono font-black text-2xl tracking-[0.35em] rounded-2xl bg-white dark:bg-neutral-900 border-2 border-emerald-500/30 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 text-neutral-900 dark:text-white"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                setCode(val);
              }}
              required
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer"
          disabled={loading || code.length !== 8}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verificando...</span>
            </div>
          ) : (
            <>
              <span>Activar Cuenta e Ingresar</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        {/* Reenviar código */}
        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            href="/login"
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
          >
            ← Volver al Inicio de Sesión
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`size-3 ${resending ? "animate-spin" : ""}`} />
            <span>{resending ? "Reenviando..." : "Reenviar clave de 8 dígitos"}</span>
          </button>
        </div>
      </form>

      {/* Tarjeta de Soporte */}
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
        <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Canales de Contacto Directo</span>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
          ¿No recibiste el correo? Escríbenos directamente y te ayudaremos a activar tu negocio de inmediato:
        </p>
        <a
          href={`https://wa.me/584223877002?text=Hola%2C%20necesito%20ayuda%20para%20verificar%20mi%20correo%20en%20Qu%C3%A1dralo%20(${encodeURIComponent(email)})`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
        >
          <span>💬 WhatsApp del Desarrollador (+58 422 387 7002) →</span>
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
