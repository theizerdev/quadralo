"use client";

import React, { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface ForgotPasswordResponse {
  message: string;
  success: boolean;
  reset_code?: string;
}

type Step = "email" | "code" | "new_password" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Paso 1: Solicitar la clave de 8 dígitos al correo
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setDevCode(null);
    setLoading(true);

    try {
      const data = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      setInfoMsg(data.message || `Hemos enviado un código de 8 dígitos a ${email}`);
      if (data.reset_code) {
        setDevCode(data.reset_code);
      }
      setStep("code");
    } catch (err: any) {
      setError(err.message || "No se pudo procesar la solicitud. Verifica el correo e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (!email) return;
    setError(null);
    setResending(true);
    try {
      const data = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setInfoMsg("Nuevo código de 8 dígitos enviado a tu correo.");
      if (data.reset_code) {
        setDevCode(data.reset_code);
      }
    } catch (err: any) {
      setError(err.message || "Error al reenviar el código. Intenta de nuevo.");
    } finally {
      setResending(false);
    }
  };

  // Paso 2: Verificar la clave de 8 dígitos
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 8) {
      setError("Por favor ingresa la clave completa de 8 dígitos numéricos.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch<ForgotPasswordResponse>("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      setInfoMsg("Código verificado exitosamente. Ahora crea tu nueva contraseña.");
      setStep("new_password");
    } catch (err: any) {
      setError(err.message || "Código incorrecto o expirado. Verifica los 8 números.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Guardar la nueva contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifícalas.");
      return;
    }

    setLoading(true);
    try {
      const cleanCode = code.replace(/\D/g, "");
      await apiFetch<ForgotPasswordResponse>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
          new_password: newPassword,
        }),
      });

      setStep("success");
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la contraseña. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de Éxito Final
  if (step === "success") {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-300 py-4">
        <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="size-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            ¡Contraseña Actualizada!
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Tu nueva contraseña ha sido guardada de forma segura. Ya puedes ingresar a tu cuenta de <strong className="text-neutral-700 dark:text-neutral-200">Quádralo</strong>.
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
      {/* Indicador de Pasos */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="size-3.5" />
          <span>
            {step === "email" && "Paso 1 de 3: Correo Registrado"}
            {step === "code" && "Paso 2 de 3: Clave de 8 Dígitos"}
            {step === "new_password" && "Paso 3 de 3: Nueva Contraseña"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`size-2 rounded-full ${step === "email" ? "bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-800" : "bg-emerald-600"}`} />
          <span className={`size-2 rounded-full ${step === "code" ? "bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-800" : step === "new_password" ? "bg-emerald-600" : "bg-neutral-200 dark:bg-neutral-800"}`} />
          <span className={`size-2 rounded-full ${step === "new_password" ? "bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-800" : "bg-neutral-200 dark:bg-neutral-800"}`} />
        </div>
      </div>

      {/* Encabezado según el paso actual */}
      <div className="space-y-2 text-left">
        {step === "email" && (
          <>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Ingresa tu correo electrónico registrado y te enviaremos una <strong className="text-neutral-700 dark:text-neutral-200">clave de 8 dígitos</strong> para verificar tu identidad.
            </p>
          </>
        )}

        {step === "code" && (
          <>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Ingresa la Clave de 8 Dígitos
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Hemos enviado un código numérico aleatorio a <strong className="text-emerald-700 dark:text-emerald-300 font-medium">{email}</strong>.
            </p>
          </>
        )}

        {step === "new_password" && (
          <>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Crear Nueva Contraseña
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Clave de 8 dígitos validada con éxito. Ahora define tu nueva contraseña de acceso.
            </p>
          </>
        )}
      </div>

      {/* Mensajes de Estado / Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}

      {infoMsg && !error && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs sm:text-sm border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div>{infoMsg}</div>
        </div>
      )}

      {/* Notificación para desarrollo si SMTP no está configurado */}
      {devCode && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Código de prueba: <strong className="font-mono font-bold tracking-widest">{devCode}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setCode(devCode)}
            className="px-2 py-0.5 rounded-md bg-amber-200/70 dark:bg-amber-800 text-[11px] font-bold hover:bg-amber-300 transition-colors"
          >
            Autocompletar
          </button>
        </div>
      )}

      {/* -------------------- PASO 1: CORREO -------------------- */}
      {step === "email" && (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Correo Electrónico de tu Cuenta
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                className="pl-10 h-11 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
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
                <span>Generando clave de seguridad...</span>
              </div>
            ) : (
              <>
                <span>Enviar Clave de 8 Dígitos</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* -------------------- PASO 2: CLAVE DE 8 DÍGITOS -------------------- */}
      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
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
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 text-center">
              Revisa tu correo o carpeta de spam. El código es válido por 15 minutos.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer"
            disabled={loading || code.length !== 8}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Validando clave de 8 dígitos...</span>
              </div>
            ) : (
              <>
                <span>Validar Código y Continuar</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError(null);
              }}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              ← Cambiar correo
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`size-3 ${resending ? "animate-spin" : ""}`} />
              <span>{resending ? "Reenviando..." : "Reenviar código"}</span>
            </button>
          </div>
        </form>
      )}

      {/* -------------------- PASO 3: NUEVA CONTRASEÑA -------------------- */}
      {step === "new_password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
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
                className="pl-10 pr-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Validaciones visuales */}
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

          <Button
            type="submit"
            className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer mt-2"
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Guardando contraseña...</span>
              </div>
            ) : (
              <>
                <span>Guardar Nueva Contraseña</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* Enlace para Volver a Iniciar Sesión */}
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
