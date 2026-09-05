"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Mail,
  Server,
  ShieldCheck,
  Send,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Key,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SMTPSettingsData {
  id?: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  sender_name: string;
  use_tls: boolean;
  use_ssl: boolean;
  is_active: boolean;
  has_password: boolean;
  updated_at?: string;
}

export default function GoogleSmtpPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<SMTPSettingsData>({
    smtp_host: "smtp.gmail.com",
    smtp_port: 587,
    smtp_user: "",
    sender_name: "Quádralo Finanzas",
    use_tls: true,
    use_ssl: false,
    is_active: true,
    has_password: false,
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isSuperAdmin = user?.is_superuser || user?.role === "superadmin";

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/dashboard");
      return;
    }

    if (user && isSuperAdmin) {
      loadSettings();
      if (user.email) {
        setTestEmail(user.email);
      }
    }
  }, [user, authLoading, isSuperAdmin, router]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<SMTPSettingsData>("/integrations/smtp");
      setSettings(data);
      if (!data.smtp_user && user?.email) {
        setSettings((prev) => ({ ...prev, smtp_user: user.email }));
      }
    } catch (err: any) {
      toast.error("Error al cargar la configuración SMTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        smtp_host: settings.smtp_host,
        smtp_port: Number(settings.smtp_port),
        smtp_user: settings.smtp_user,
        sender_name: settings.sender_name,
        use_tls: settings.use_tls,
        use_ssl: settings.use_ssl,
        is_active: settings.is_active,
      };

      if (password.trim()) {
        payload.smtp_password = password.trim();
      }

      const res = await apiFetch<SMTPSettingsData>("/integrations/smtp", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSettings(res);
      setPassword("");
      toast.success("¡Configuración de Google SMTP guardada con éxito!");
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Por favor ingresa un correo electrónico válido para la prueba.");
      return;
    }

    setTesting(true);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>("/integrations/smtp/test", {
        method: "POST",
        body: JSON.stringify({ recipient_email: testEmail }),
      });

      toast.success(res.message || "Correo de prueba enviado exitosamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al enviar el correo de prueba.");
    } finally {
      setTesting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="size-6 animate-spin text-emerald-500" />
        <p className="text-xs text-neutral-500">Cargando integración SMTP...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DE LA SECCIÓN (FULL WIDTH)                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900/70 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs w-full">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="size-3" />
            <span>Empresa Principal · Theizer dev (SuperAdmin)</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Integración SMTP de Google (Gmail)
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Canal oficial para envío de correos, notificaciones de cuadre de caja, alertas de rentabilidad y recuperación de contraseñas.
              </p>
            </div>
          </div>
        </div>

        {/* Estado actual de la integración */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs ${
              settings.has_password && settings.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                settings.has_password && settings.is_active
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              }`}
            />
            <span>
              {settings.has_password && settings.is_active
                ? "Conectado y Listo"
                : "Pendiente de Contraseña"}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="text-xs gap-1.5 rounded-xl cursor-pointer"
          >
            <HelpCircle className="size-3.5 text-neutral-500" />
            <span>{showGuide ? "Ocultar Guía" : "Guía de Google"}</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GUÍA DESPLEGABLE: CÓMO GENERAR LA CONTRASEÑA DE APLICACIÓN EN GOOGLE    */}
      {/* ========================================================================= */}
      {showGuide && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border border-emerald-500/30 shadow-xl space-y-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">
                ¿Cómo obtener tu Contraseña de Aplicación de Google (16 letras)?
              </h3>
            </div>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
            >
              <span>Abrir Google App Passwords</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Google exige una <strong>Contraseña de Aplicación</strong> especial de 16 caracteres para conectar sistemas externos (no utilices tu contraseña normal de inicio de sesión de Gmail).
          </p>

          <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-neutral-300 pt-1">
            <li className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                1
              </span>
              <p className="font-semibold text-white">Verificación en 2 pasos</p>
              <p className="text-[11px] text-neutral-400">
                Asegúrate de que tu cuenta de Gmail tenga activa la verificación en dos pasos.
              </p>
            </li>
            <li className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                2
              </span>
              <p className="font-semibold text-white">Contraseñas de apps</p>
              <p className="text-[11px] text-neutral-400">
                Ingresa a Seguridad &gt; Contraseñas de aplicaciones en tu cuenta Google.
              </p>
            </li>
            <li className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                3
              </span>
              <p className="font-semibold text-white">Nombre "Quádralo"</p>
              <p className="text-[11px] text-neutral-400">
                Escribe como nombre de la aplicación <strong>Quádralo</strong> y haz clic en <em>Crear</em>.
              </p>
            </li>
            <li className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                4
              </span>
              <p className="font-semibold text-white">Copiar los 16 caracteres</p>
              <p className="text-[11px] text-neutral-400">
                Copia el código amarillo de 16 letras (ej: <code>abcd efgh ijkl mnop</code>) y pégalo abajo.
              </p>
            </li>
          </ol>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FORMULARIO PRINCIPAL Y TARJETA DE PRUEBA (FULL WIDTH)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Lado Izquierdo: Formulario de Parámetros (2 Columnas) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-neutral-900 p-6 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-6 w-full">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white">
                Parámetros de Conexión Google SMTP
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">Servicio Saliente</span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Host */}
              <div className="space-y-1.5">
                <Label htmlFor="smtp_host" className="text-xs font-semibold">
                  Servidor SMTP (Host)
                </Label>
                <Input
                  id="smtp_host"
                  type="text"
                  value={settings.smtp_host}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_host: e.target.value })
                  }
                  placeholder="smtp.gmail.com"
                  className="h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs w-full"
                  required
                />
              </div>

              {/* Puerto */}
              <div className="space-y-1.5">
                <Label htmlFor="smtp_port" className="text-xs font-semibold">
                  Puerto SMTP
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_port: Number(e.target.value) })
                    }
                    placeholder="587"
                    className="h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs w-32"
                    required
                  />
                  <span className="text-[11px] text-neutral-400">
                    587 (TLS recomendado) ó 465 (SSL)
                  </span>
                </div>
              </div>

              {/* Correo Remitente */}
              <div className="space-y-1.5">
                <Label htmlFor="smtp_user" className="text-xs font-semibold">
                  Correo Electrónico de Google (Remitente)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <Input
                    id="smtp_user"
                    type="email"
                    value={settings.smtp_user}
                    onChange={(e) =>
                      setSettings({ ...settings, smtp_user: e.target.value })
                    }
                    placeholder="theizerdev@gmail.com"
                    className="pl-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs w-full"
                    required
                  />
                </div>
              </div>

              {/* Nombre del Remitente */}
              <div className="space-y-1.5">
                <Label htmlFor="sender_name" className="text-xs font-semibold">
                  Nombre del Remitente
                </Label>
                <Input
                  id="sender_name"
                  type="text"
                  value={settings.sender_name}
                  onChange={(e) =>
                    setSettings({ ...settings, sender_name: e.target.value })
                  }
                  placeholder="Quádralo Finanzas"
                  className="h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs w-full"
                  required
                />
              </div>

              {/* Contraseña de Aplicación */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="smtp_password" className="text-xs font-semibold">
                    Contraseña de Aplicación de Google (16 caracteres)
                  </Label>
                  {settings.has_password && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Contraseña configurada previamente
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <Input
                    id="smtp_password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      settings.has_password
                        ? "•••••••••••••••• (dejar en blanco para conservar actual)"
                        : "Ingresa la contraseña de aplicación de 16 caracteres"
                    }
                    className="pl-10 pr-10 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs font-mono w-full"
                    required={!settings.has_password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Generada en tu cuenta de Google. Puedes ingresar los 16 caracteres con o sin espacios.
                </p>
              </div>
            </div>

            {/* Opciones de Seguridad y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.use_tls}
                  onChange={(e) =>
                    setSettings({ ...settings, use_tls: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 size-4"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Usar Cifrado STARTTLS
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Recomendado para el puerto 587
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.is_active}
                  onChange={(e) =>
                    setSettings({ ...settings, is_active: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 size-4"
                />
                <div>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                    Servicio Activo
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Habilita el envío automático en el sistema
                  </span>
                </div>
              </label>
            </div>

            {/* Botón de Guardado */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto h-11 px-8 font-bold text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Guardando configuración...</span>
                  </div>
                ) : (
                  <span>Guardar Configuración SMTP</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Lado Derecho: Enviar Prueba de Correo (1 Columna) */}
        <div className="space-y-6 w-full">
          <div className="rounded-2xl bg-white dark:bg-neutral-900 p-6 sm:p-7 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4 w-full">
            <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <Send className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Prueba en Vivo de Envío
              </h3>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Envía un correo de verificación en tiempo real usando tus credenciales de Google SMTP guardadas para confirmar que no hay bloqueos.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="test_email" className="text-xs font-semibold">
                Destinatario de Prueba
              </Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-xs"
              />
            </div>

            <Button
              type="button"
              onClick={handleTestEmail}
              disabled={testing || !settings.has_password}
              className="w-full h-10 font-bold text-xs rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm cursor-pointer gap-2"
            >
              {testing ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Enviando correo de prueba...</span>
                </div>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar Correo de Prueba</span>
                </>
              )}
            </Button>

            {!settings.has_password && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="size-3.5 shrink-0" />
                Guarda primero la contraseña de aplicación para habilitar el botón de prueba.
              </p>
            )}
          </div>

          {/* Tarjeta de Seguridad y Privacidad */}
          <div className="rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/30 p-5 border border-neutral-200/60 dark:border-neutral-800 space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Seguridad Cifrada TLS</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Las credenciales de SMTP se almacenan de forma segura y se transmiten mediante canales cifrados TLS/SSL hacia los servidores oficiales de Google LLC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
