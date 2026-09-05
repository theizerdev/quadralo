"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, CheckCircle2, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    // 1. Registrar Service Worker en producción o local
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registrado exitosamente con scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Error al registrar Service Worker:", err);
          });
      });
    }

    // 2. Detectar si ya está en modo Standalone (instalada)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Mostrar banner opcional tras unos segundos si no se ha descartado en la sesión
      const dismissed = sessionStorage.getItem("quadralo_pwa_ios_dismissed");
      if (!dismissed) {
        setTimeout(() => setShowIosPrompt(true), 3000);
      }
    }

    // 4. Capturar evento de instalación estándar (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      const dismissed = sessionStorage.getItem("quadralo_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. Detectar cuando el usuario instala la app
    const handleAppInstalled = () => {
      console.log("[PWA] Quádralo ha sido instalada exitosamente");
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. Listener para disparar instalación desde cualquier menú
    const handleCustomTrigger = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          setDeferredPrompt(null);
          setShowBanner(false);
        });
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener("quadralo:install-pwa", handleCustomTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("quadralo:install-pwa", handleCustomTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        console.log("[PWA] Usuario aceptó la instalación");
      } else {
        console.log("[PWA] Usuario declinó la instalación");
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (err) {
      console.error("[PWA] Error durante el prompt de instalación:", err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("quadralo_pwa_dismissed", "true");
  };

  const handleDismissIos = () => {
    setShowIosPrompt(false);
    sessionStorage.setItem("quadralo_pwa_ios_dismissed", "true");
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Banner de Instalación Rápida Flotante (Android / Windows / Chrome) */}
      {showBanner && isInstallable && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-neutral-900 text-white dark:bg-neutral-800 p-4 rounded-2xl shadow-2xl border border-emerald-500/30 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Smartphone className="size-5" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm tracking-tight">Instalar Quádralo</h4>
                <p className="text-xs text-neutral-300">
                  Accede como una App nativa en tu escritorio o móvil.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-800 dark:border-neutral-700">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Download className="size-3.5" />
              <span>Instalar Aplicación</span>
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-xs text-neutral-400 hover:text-white rounded-xl"
            >
              Ahora no
            </Button>
          </div>
        </div>
      )}

      {/* Banner Especial para iOS Safari */}
      {showIosPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-neutral-900 text-white dark:bg-neutral-800 p-4 rounded-2xl shadow-2xl border border-neutral-700 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Share className="size-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs">Instala Quádralo en iPhone/iPad</h4>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  Toca el botón <strong>Compartir</strong> y selecciona <strong>"Agregar a pantalla de inicio"</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissIos}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
