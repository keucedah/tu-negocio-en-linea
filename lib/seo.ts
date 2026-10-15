// Direcciones oficiales para Google (canónicas), el sitemap y robots.txt.
import { URL_SITIO } from "./config";

/** Dirección principal de la plataforma, con www. Se cambia con URL_SITIO en Vercel. */
export const SITIO = URL_SITIO || "https://www.tunegocioenlineahn.com";

/** Host de la plataforma sin www (tunegocioenlineahn.com). */
export const HOST_SITIO = new URL(SITIO).hostname.replace(/^www\./, "");

/** Dirección pública de una tienda: su dominio propio si lo tiene; si no, la plataforma + /slug. */
export function urlTienda(t: { slug: string; dominio?: string | null }, ruta = ""): string {
  if (t.dominio) return `https://${t.dominio}${ruta || "/"}`;
  return `${SITIO}/${t.slug}${ruta}`;
}

/** Texto corto para la descripción de Google (máx. ~160 letras), sin saltos de línea. */
export function resumen(texto: string, max = 160): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? limpio.slice(0, max - 1).trimEnd() + "…" : limpio;
}
