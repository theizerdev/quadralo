"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  reset_token?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponseMsg(null);
    setResetToken(null);
    setLoading(true);

    try {
      const data = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResponseMsg(data.message);
      if (data.reset_token) {
        setResetToken(data.reset_token);
      }
    } catch (err: any) {
      setError(err.message || "No se pudo procesar la solicitud. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <KeyRound className="size-3" />
          <span>Recuperación de Acceso</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No te preocupes. Ingresa tu correo electrónico registrado y te ayudaremos a restablecerla en segundos.
        </p>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Mensaje de Éxito */}
      {responseMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs sm:text-sm border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-0.5">Solicitud procesada</div>
              <p className="text-xs leading-relaxed">{responseMsg}</p>
            </div>
          </div>

          {/* Acceso directo si se generó el token (modo de desarrollo / pruebas locales) */}
          {resetToken && (
            <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
              <Link href={`/reset-password?token=${resetToken}`}>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 font-bold shadow-sm">
                  <span>Continuar a Crear Nueva Contraseña →</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      {!responseMsg && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Correo Electrónico de tu Cuenta
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
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Enviando solicitud...</span>
              </div>
            ) : (
              <>
                <span>Enviar Instrucciones de Recuperación</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Volver a Iniciar Sesión */}
      <div className="pt-2 text-center border-t border-neutral-200 dark:border-neutral-800">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver al Inicio de Sesión</span>
        </Link>
      </div>
    </div>
  );
}
