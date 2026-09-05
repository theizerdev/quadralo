"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, AuthResponse, RegisterResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

type Step = "form" | "verify";

export default function RegisterPage() {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("form");

  // Campos de Registro
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verificación de Correo (8 dígitos)
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Paso 1: Enviar formulario de registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const data = await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });

      setInfoMsg(data.message || "Hemos enviado un código de 8 dígitos a tu correo.");
      if (data.verification_code) {
        setDevCode(data.verification_code);
      }
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Error al registrar la cuenta. Verifica los datos ingresados.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Validar clave de 8 dígitos y activar cuenta
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.replace(/\D/g, "");
    if (cleanCode.length !== 8) {
      setError("Por favor ingresa la clave completa de 8 dígitos numéricos.");
      return;
    }

    setLoading(true);

    try {
      const authData = await apiFetch<AuthResponse>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      // Login exitoso y redirección al Dashboard
      login(authData);
    } catch (err: any) {
      setError(err.message || "Clave de verificación incorrecta o expirada.");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código de verificación
  const handleResendCode = async () => {
    if (!email) return;
    setError(null);
    setResending(true);
    try {
      const res = await apiFetch<{ message: string; reset_code?: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setInfoMsg("Nuevo código de verificación enviado a tu correo.");
      if (res.reset_code) {
        setDevCode(res.reset_code);
      }
    } catch (err: any) {
      setError(err.message || "Error al reenviar el código. Intenta nuevamente.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <title>Registrar Negocio | Quádralo</title>
      <meta
        name="description"
        content="Crea tu cuenta gratis en Quádralo. Controla tus ventas, registra compras y calcula tus márgenes con la tasa oficial BCV en tiempo real."
      />
      {/* -------------------- PASO 1: FORMULARIO DE REGISTRO -------------------- */}
      {step === "form" && (
        <>
          {/* Título de Registro */}
          <div className="space-y-2 text-left">
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="size-3" />
              <span>Comienza en 1 minuto</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Registrar Negocio
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Crea tu cuenta SaaS y empieza a cuadrar tus compras, ventas y márgenes en tiempo real.
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 animate-in fade-in duration-200">
              <div className="font-semibold mb-0.5">No pudimos crear tu cuenta</div>
              <div>{error}</div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Campo: Nombre Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Tu Nombre y Apellido
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Campo: Nombre del Negocio */}
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Nombre de tu Negocio / Emprendimiento
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Ej: Inversiones Los Andes, C.A."
                  className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo: Correo Electrónico */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Correo Electrónico (se enviará código de verificación)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@tunegocio.com"
                  className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo: Teléfono / WhatsApp */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Número Telefónico / WhatsApp
                </Label>
                <span className="text-[10px] text-neutral-400">Para alertas y soporte</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej: +58 412 1234567 o 0414 1234567"
                  className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Contraseña Segura (mínimo 6 caracteres)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="pl-10 pr-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Registro */}
            <Button
              type="submit"
              className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer mt-2"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enviando código de verificación...</span>
                </div>
              ) : (
                <>
                  <span>Registrar Negocio y Verificar Correo</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Enlace para Iniciar Sesión */}
          <div className="pt-2 text-center border-t border-neutral-200 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ¿Ya tienes una cuenta registrada?{" "}
              <Link href="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Inicia Sesión aquí
              </Link>
            </p>
          </div>
        </>
      )}

      {/* -------------------- PASO 2: VERIFICACIÓN DE CORREO -------------------- */}
      {step === "verify" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Encabezado de Verificación */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="size-3.5" />
              <span>Verificación de Seguridad</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Confirma tu Correo
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Hemos enviado un mensaje de bienvenida y una <strong className="text-emerald-700 dark:text-emerald-300 font-medium">clave de 8 dígitos</strong> a{" "}
              <strong className="text-neutral-800 dark:text-neutral-200">{email}</strong> para validar tu cuenta.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {/* Mensaje Informativo */}
          {infoMsg && !error && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs sm:text-sm border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>{infoMsg}</div>
            </div>
          )}

          {/* Código de Prueba en Modo Desarrollo */}
          {devCode && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Código de desarrollo: <strong className="font-mono font-bold tracking-widest">{devCode}</strong></span>
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

          {/* Formulario de Código de 8 Dígitos */}
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="verifyCode" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Clave de 8 Dígitos Numéricos
                </Label>
                <span className="text-[11px] font-mono text-neutral-400">
                  {code.length}/8 dígitos
                </span>
              </div>

              <div className="relative">
                <Input
                  id="verifyCode"
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
                Revisa tu bandeja de entrada o la carpeta de spam.
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
                  <span>Verificando y activando tu cuenta...</span>
                </div>
              ) : (
                <>
                  <span>Activar mi Cuenta e Ingresar</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {/* Opciones de Reenvío y Edición */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                ← Cambiar datos / correo
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

          {/* Tarjeta de Canales de Contacto Directo */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
            <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <MessageCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>¿Necesitas ayuda con tu registro?</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
              Si tienes problemas para recibir el correo de bienvenida o deseas asistencia inmediata, puedes contactar al desarrollador:
            </p>
            <a
              href={`https://wa.me/584223877002?text=Hola%2C%20me%20estoy%20registrando%20en%20Qu%C3%A1dralo%20con%20el%20correo%20${encodeURIComponent(email)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              <span>💬 Hablar por WhatsApp (+58 422 387 7002) →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
