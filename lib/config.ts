// Acepta la dirección aunque la peguen con "/rest/v1/" o "/" al final.
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/rest\/v1$/, "");
// La integración de Supabase en Vercel puede crear la clave con cualquiera de estos dos nombres.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Sin Supabase configurado el sitio funciona en modo demostración:
 * la página pública usa los planes de ejemplo y el panel muestra clientes de ejemplo (solo lectura).
 */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Solo en el servidor (Vercel > Environment Variables). Nunca con NEXT_PUBLIC_.
// Permite crear tiendas y usuarios de tus clientes desde el panel.
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const servicioConfigurado = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

/**
 * Dirección principal de la plataforma, sin "/" al final. Ej: https://vitrinasaas.com
 * Opcional: si falta, se usa la dirección con la que se abrió el panel.
 */
export const URL_SITIO = (process.env.URL_SITIO ?? "").trim().replace(/\/+$/, "");
