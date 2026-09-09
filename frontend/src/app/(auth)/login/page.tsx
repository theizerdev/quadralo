"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, AuthResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(data);
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas. Por favor verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <title>Iniciar Sesión | Quádralo</title>
      <meta
        name="description"
        content="Inicia sesión en Quádralo para gestionar tus ventas, inversiones y márgenes de ganancia con tasa BCV en tiempo real."
      />
      {/* Título de Bienvenida */}
      <div className="space-y-2 text-left">
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Sparkles className="size-3" />
          <span>Acceso al Sistema</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Iniciar Sesión
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Ingresa tus credenciales para gestionar tus inversiones, ventas y ganancias.
        </p>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 animate-in fade-in duration-200 space-y-2">
          <div className="font-semibold">Error de acceso</div>
          <div>{error}</div>
          {error.toLowerCase().includes("verificar") && (
            <div className="pt-1.5 border-t border-red-200 dark:border-red-800/60">
              <Link href={`/verify-email?email=${encodeURIComponent(email)}`}>
                <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm cursor-pointer">
                  <span>Ingresar Clave de 8 Dígitos y Activar Cuenta →</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="ejemplo@tunegocio.com"
              className="pl-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm focus-visible:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Campo: Contraseña */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Contraseña
            </Label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
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

        {/* Botón de Enviar */}
        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-600/30 gap-2 cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Verificando credenciales...</span>
            </div>
          ) : (
            <>
              <span>Ingresar a Quádralo</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {/* Separador */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase">
          <span className="bg-slate-50 dark:bg-slate-950 px-3 text-neutral-400 font-medium">
            ¿Nuevo usuario?
          </span>
        </div>
      </div>

      {/* Enlace para Registrarse */}
      <div className="text-center space-y-2">
        <Link href="/register" className="block w-full">
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl text-xs font-semibold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Crear una cuenta para mi negocio →
          </Button>
        </Link>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Registra tu negocio en menos de 1 minuto y empieza a cuadrar tus números.
        </p>
      </div>
    </div>
  );
}
