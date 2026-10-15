import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITIO } from "@/lib/seo";

// robots.txt automático. En el dominio propio de una tienda apunta a su propio sitemap.
// Los paneles y las páginas para entrar NO se bloquean aquí: llevan "noindex" (next.config.mjs),
// y Google necesita poder abrirlas para ver esa marca y sacarlas de los resultados.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0].toLowerCase();
  const propio = host && !host.endsWith(new URL(SITIO).hostname.replace(/^www\./, "")) && !/^(localhost|127\.0\.0\.1)$|\.vercel\.app$/.test(host);
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${propio ? `https://${host}` : SITIO}/sitemap.xml`,
  };
}
