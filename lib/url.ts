import { headers } from "next/headers";
import { URL_SITIO } from "./config";

/** Dirección principal de la plataforma (https://…), sin "/" al final. */
export async function urlSitio(): Promise<string> {
  if (URL_SITIO) return URL_SITIO;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
