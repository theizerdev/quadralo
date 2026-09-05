"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("El código o token de restablecimiento es requerido.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener un mínimo de 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Token inválido o expirado. Por favor solicita uno nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-300">
        <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            ¡Contraseña Restablecida!
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Tu nueva contraseña ha sido guardada de forma segura. Ya puedes ingresar a tu cuenta de Quádralo.
          </p>
        </div>

        <Link href="/login" className="block w-full">
          <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm gap-2 shadow-md shadow-emerald-600/20">
            <span>Iniciar Sesión Ahora</span>
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Key className="size-3" />
          <span>Restablecer Contraseña</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Crear Nueva Contraseña
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ingresa tu nueva clave de acceso para proteger tu negocio y finanzas.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Token (solo visible si no vino en URL) */}
        {!tokenFromUrl && (
          <div className="space-y-1.5">
            <Label htmlFor="token" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Token de Verificación
            </Label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <Input
                id="token"
                type="text"
                placeholder="Pega aquí el token recibido"
                className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-xs focus-visible:ring-emerald-500"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Nueva Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Nueva Contraseña (mínimo 6 caracteres)
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className="pl-10 pr-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Confirmar Nueva Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        {/* Botón */}
        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer mt-2"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Guardando nueva contraseña...</span>
            </div>
          ) : (
            <>
              <span>Guardar Nueva Contraseña</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {/* Volver */}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
