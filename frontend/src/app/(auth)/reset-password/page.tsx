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
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  const codeFromUrl = searchParams.get("code") || searchParams.get("token") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState(codeFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
    if (codeFromUrl) setCode(codeFromUrl);
  }, [emailFromUrl, codeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\D/g, "");
    if (!email.trim()) {
      setError("El correo electrónico es requerido.");
      return;
    }

    if (cleanCode.length !== 8) {
      setError("Por favor ingresa la clave completa de 8 dígitos numéricos.");
      return;
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
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
          email: email.trim().toLowerCase(),
          code: cleanCode,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Clave de 8 dígitos inválida o expirada. Por favor solicita una nueva.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-300 py-4">
        <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white">
            ¡Contraseña Restablecida!
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Tu nueva clave de acceso ha sido actualizada de forma exitosa. Ya puedes ingresar a tu cuenta de Quádralo.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/login" className="block w-full">
            <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm gap-2 shadow-md shadow-emerald-600/20 cursor-pointer">
              <span>Iniciar Sesión Ahora</span>
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="space-y-2 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <KeyRound className="size-3" />
          <span>Restablecer Contraseña</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Crear Nueva Contraseña
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Ingresa tu correo, la clave de 8 dígitos recibida y tu nueva contraseña.
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
        {/* Correo Electrónico */}
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

        {/* Clave de 8 Dígitos */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="code" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Clave de 8 Dígitos Numéricos
            </Label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ¿No tienes código? Solicítalo aquí
            </Link>
          </div>
          <div className="relative">
            <ShieldCheck className="absolute left-3.5 top-3 size-4 text-neutral-400" />
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder="12345678"
              className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm font-mono tracking-widest font-bold focus-visible:ring-emerald-500"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              required
            />
          </div>
        </div>

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

        {/* Validaciones */}
        <div className="space-y-1 pt-1 text-[11px]">
          <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"}`}>
            <span className={`size-1.5 rounded-full ${newPassword.length >= 6 ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"}`} />
            <span>Al menos 6 caracteres</span>
          </div>
          <div className={`flex items-center gap-1.5 ${newPassword && confirmPassword && newPassword === confirmPassword ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400"}`}>
            <span className={`size-1.5 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"}`} />
            <span>Las contraseñas coinciden</span>
          </div>
        </div>

        {/* Botón */}
        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer mt-2"
          disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword || code.length !== 8}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Restableciendo contraseña...</span>
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
