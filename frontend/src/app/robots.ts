import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/forgot-password"],
        disallow: [
          "/api/",
          "/dashboard",
          "/inversiones",
          "/ventas",
          "/ganancias",
          "/integraciones",
          "/bcv",
          "/verify-email",
          "/reset-password",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/login", "/register", "/forgot-password"],
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://quadralo.theizerdev.com/sitemap.xml",
    host: "https://quadralo.theizerdev.com",
  };
}
