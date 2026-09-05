"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, AuthResponse } from "@/lib/api";
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
} from "lucide-react";

export default function RegisterPage() {
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          business_name: businessName,
          email,
          phone: phone.trim(),
          password,
        }),
      });
      login(data);
    } catch (err: any) {
      setError(err.message || "Error al registrar la cuenta. Verifica los datos ingresados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
            Correo Electrónico
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
              <span>Creando tu cuenta...</span>
            </div>
          ) : (
            <>
              <span>Registrar Negocio Gratis</span>
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
    </div>
  );
}
