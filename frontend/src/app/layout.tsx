import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstaller } from "@/components/pwa-installer";
import { WhatsAppButton } from "@/components/whatsapp-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10B981" },
    { media: "(prefers-color-scheme: dark)", color: "#090D16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://quadralo.theizerdev.com"),
  title: {
    default: "Quádralo | Finanzas, Ventas, Márgenes y Tasa BCV en Tiempo Real",
    template: "%s | Quádralo",
  },
  description:
    "Controla tus ventas, registra compras y calcula márgenes de ganancia reales en bolívares y dólares. Automatiza tus precios con la tasa oficial BCV en tiempo real.",
  keywords: [
    "Quádralo",
    "tasa BCV hoy",
    "tasa oficial BCV",
    "control de ventas Venezuela",
    "calcular ganancias en dólares y bolívares",
    "gestión de inventario para emprendedores",
    "calculadora de margen de ganancia",
    "sistema contable para pymes",
    "administración de negocios en Venezuela",
    "software punto de venta",
    "precio dólar BCV oficial hoy",
    "registro de inversiones",
    "Theizer dev",
    "finanzas para emprendedores",
  ],
  authors: [{ name: "Theizer Gonzalez", url: "https://theizerdev.com" }],
  creator: "Theizer Gonzalez",
  publisher: "Quádralo",
  applicationName: "Quádralo",
  category: "finance",
  alternates: {
    canonical: "https://quadralo.theizerdev.com",
  },
  openGraph: {
    title: "Quádralo | Finanzas, Ventas, Márgenes y Tasa BCV en Tiempo Real",
    description:
      "La solución definitiva para comercios y emprendedores: sincroniza precios con la tasa oficial BCV, registra ventas multimoneda y visualiza tus ganancias netas.",
    url: "https://quadralo.theizerdev.com",
    siteName: "Quádralo",
    locale: "es_VE",
    type: "website",
    images: [
      {
        url: "/login_hero.jpg",
        width: 1200,
        height: 630,
        alt: "Quádralo - Gestión Financiera Inteligente y Tasa BCV",
      },
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Logotipo Oficial de Quádralo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quádralo | Finanzas, Ventas y Tasa BCV en Tiempo Real",
    description:
      "Automatiza tus precios con la tasa oficial BCV, gestiona ventas e inventario multimoneda y maximiza tu rentabilidad.",
    images: ["/login_hero.jpg"],
    creator: "@theizerdev",
    site: "@theizerdev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quádralo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://quadralo.theizerdev.com/#webapp",
      "name": "Quádralo",
      "url": "https://quadralo.theizerdev.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "description":
        "Plataforma inteligente de finanzas, control de ventas, cálculo de márgenes de ganancia e integración de tasa oficial BCV para emprendedores y negocios en Venezuela.",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "author": {
        "@type": "Person",
        "name": "Theizer Gonzalez",
        "url": "https://theizerdev.com",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://quadralo.theizerdev.com/#organization",
      "name": "Quádralo",
      "url": "https://quadralo.theizerdev.com",
      "logo": "https://quadralo.theizerdev.com/logo.jpg",
      "sameAs": ["https://theizerdev.com"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950`}
      >
        <AuthProvider>
          {children}
          <Toaster />
          <PwaInstaller />
          <WhatsAppButton />
        </AuthProvider>
      </body>
    </html>
  );
}
