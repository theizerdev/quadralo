"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { QuadraloCubeIcon } from "@/components/app-logo";

const DEVELOPER_PHONE = "584223877002";
const DEFAULT_GREETING =
  "¡Hola! 👋 Soy el desarrollador de Quádralo. Estoy disponible para ayudarte con cualquier duda sobre tus inversiones, cálculo de ganancias, tasa BCV o funciones personalizadas.";

const QUICK_OPTIONS = [
  {
    id: "duda",
    label: "📊 Dudas sobre cálculos / inversiones",
    text: "Hola, tengo una consulta sobre el registro de inversiones y cálculo de ganancias en Quádralo.",
  },
  {
    id: "custom",
    label: "💡 Solicitar función a medida",
    text: "Hola, me gustaría conversar sobre una función personalizada para mi negocio en Quádralo.",
  },
  {
    id: "soporte",
    label: "🛠️ Soporte técnico o reporte",
    text: "Hola, necesito soporte técnico con respecto al sistema Quádralo.",
  },
  {
    id: "general",
    label: "👋 Saludar y consultar información",
    text: "Hola, me gustaría conversar directamente contigo sobre el sistema Quádralo.",
  },
];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
  const [timeString, setTimeString] = useState("12:00");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generar hora local actual para la burbuja
    const now = new Date();
    setTimeString(
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );

    // Mostrar aviso emergente sutil tras 3.5 segundos si no se ha abierto
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("quadralo_wa_dismissed");
      if (!dismissed) {
        setHasUnreadNotice(true);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  // Cerrar al presionar Escape o click afuera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        // click afuera
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHasUnreadNotice(false);
        sessionStorage.setItem("quadralo_wa_dismissed", "true");
      }
      return next;
    });
  };

  const handleSendMessage = (textToSend?: string) => {
    const finalContent = textToSend || message.trim() || "Hola, me gustaría conversar sobre el sistema Quádralo.";
    const encoded = encodeURIComponent(finalContent);
    const url = `https://wa.me/${DEVELOPER_PHONE}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleQuickOption = (optionText: string) => {
    setMessage(optionText);
    handleSendMessage(optionText);
  };

  return (
    <div
      ref={popoverRef}
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end"
      aria-label="Atención y soporte directo con el desarrollador por WhatsApp"
    >
      {/* ========================================================================= */}
      {/* 1. VENTANA FLOTANTE / TARJETA INTERACTIVA DE CHAT WHATSAPP                */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[380px] max-w-[420px] rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl shadow-emerald-950/20 dark:shadow-black/60 animate-in slide-in-from-bottom-5 fade-in-50 duration-300">
          {/* Header Superior estilo WhatsApp / FinTech */}
          <div className="bg-gradient-to-r from-emerald-600 via-[#128C7E] to-[#075E54] p-4 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar del Desarrollador */}
                <div className="relative">
                  <div className="size-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                    <QuadraloCubeIcon className="size-6 text-emerald-100 drop-shadow" />
                  </div>
                  {/* Punto En Línea */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-3.5 bg-emerald-400 border-2 border-emerald-700"></span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white tracking-tight">
                      Desarrollador Quádralo
                    </h3>
                    <span className="bg-emerald-400/20 text-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300/30">
                      Oficial
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/90 flex items-center gap-1 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    En línea • Respuesta habitual en minutos
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="size-8 rounded-full bg-black/10 hover:bg-black/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Cerrar ventana de WhatsApp"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Número y canal */}
            <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100/80">
              <span>Canal directo verificado</span>
              <span className="font-mono font-medium text-white tracking-wider">
                +58 422 387 7002
              </span>
            </div>
          </div>

          {/* Cuerpo del Chat con fondo patrón WhatsApp */}
          <div className="p-4 space-y-4 max-h-[340px] overflow-y-auto bg-neutral-100/80 dark:bg-neutral-950/60">
            {/* Pill de Fecha */}
            <div className="flex justify-center">
              <span className="text-[10px] font-medium bg-white/80 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-full shadow-xs border border-neutral-200/50 dark:border-neutral-700/50">
                Hoy
              </span>
            </div>

            {/* Burbuja de Mensaje Recibido (Del Desarrollador) */}
            <div className="flex items-start gap-2 max-w-[92%]">
              <div className="bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 p-3.5 rounded-2xl rounded-tl-sm shadow-sm border border-neutral-200/60 dark:border-neutral-700/60 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  <Sparkles className="size-3" />
                  <span>Soporte & Desarrollo Directo</span>
                </div>
                <p>{DEFAULT_GREETING}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-neutral-400 pt-1">
                  <span>{timeString}</span>
                  <CheckCheck className="size-3.5 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Opciones rápidas de inicio de conversación */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 px-1">
                Preguntas frecuentes o temas directos:
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleQuickOption(opt.text)}
                    className="w-full text-left text-xs bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-400 dark:hover:border-emerald-500/50 text-neutral-700 dark:text-neutral-200 p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-700/70 transition-all duration-150 flex items-center justify-between group shadow-xs"
                  >
                    <span className="truncate pr-2 font-medium">
                      {opt.label}
                    </span>
                    <ArrowRight className="size-3.5 text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Barra de Entrada / Envío de Mensaje Personalizado */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje para WhatsApp..."
                className="flex-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-neutral-400"
              />
              <button
                type="submit"
                className="size-9 rounded-xl bg-[#25D366] hover:bg-emerald-600 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-500/20 shrink-0"
                aria-label="Enviar mensaje a WhatsApp"
                title="Abrir en WhatsApp"
              >
                <Send className="size-4 -ml-0.5" />
              </button>
            </form>

            {/* Micro Footer de Privacidad */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>Chat cifrado vía WhatsApp</span>
              </span>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Abrir chat directo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. GLOBO SUTIL DE BIENVENIDA (Solo visible cuando la ventana está cerrada) */}
      {/* ========================================================================= */}
      {!isOpen && hasUnreadNotice && (
        <div className="mb-2 max-w-[240px] bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 p-3 rounded-2xl rounded-br-xs shadow-xl border border-emerald-500/20 dark:border-emerald-500/30 text-xs animate-in slide-in-from-bottom-3 fade-in duration-300 flex items-start gap-2.5">
          <div className="size-2 rounded-full bg-emerald-500 animate-ping shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-semibold text-neutral-900 dark:text-white leading-tight">
              ¿Dudas con Quádralo?
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
              Chatea directamente con el persona de soporte.
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHasUnreadNotice(false);
              sessionStorage.setItem("quadralo_wa_dismissed", "true");
            }}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BOTÓN FLOTANTE PRINCIPAL DE WHATSAPP                                   */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2">
        {/* Tooltip visible solo en desktop al hacer hover si la ventana no está abierta */}
        {!isOpen && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 text-xs font-semibold shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hablar con el desarrollador</span>
          </div>
        )}

        <button
          onClick={handleToggle}
          aria-expanded={isOpen}
          className={`group relative flex items-center justify-center size-14 sm:size-15 rounded-full text-white shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/50 ${isOpen
              ? "bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-900 shadow-neutral-900/30 rotate-90"
              : "bg-[#25D366] hover:bg-[#20bd5a] hover:scale-105 active:scale-95 shadow-[0_8px_30px_rgb(37,211,102,0.35)] hover:shadow-[0_12px_35px_rgb(37,211,102,0.5)]"
            }`}
          aria-label={
            isOpen
              ? "Cerrar ventana de contacto con el desarrollador"
              : "Abrir chat de WhatsApp con el desarrollador (+58 422 387 7002)"
          }
        >
          {isOpen ? (
            <X className="size-6 transition-transform duration-300 -rotate-90" />
          ) : (
            <>
              {/* Ícono Oficial de WhatsApp en SVG Vectorial */}
              <svg
                className="size-7 sm:size-8 fill-white drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>

              {/* Ping Pulsante verde/blanco indicando disponibilidad en tiempo real */}
              <span className="absolute top-0 right-0 flex size-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
                <span className="relative inline-flex rounded-full size-4 bg-emerald-400 border-2 border-white dark:border-neutral-900"></span>
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
