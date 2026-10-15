import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/config";

// Una sola plataforma para todo:
//   sitio.com/            → página principal de la plataforma
//   sitio.com/admin       → tu panel de clientes (sin sesión → /entrar)
//   sitio.com/mototaxi/…  → página personal de un mototaxista (enlace privado)
//   sitio.com/ana/...     → tienda "ana" (sin sesión, /ana/admin → /ana/entrar)
//   ana.com/...           → tienda "ana" por su dominio propio (se busca en tiendas.dominio)

const HOSTS_SIN_DOMINIO = /(^localhost$)|(^127\.0\.0\.1$)|(\.vercel\.app$)/;
// Primeras partes de la ruta que son de la plataforma, no de una tienda.
const RUTAS_PLATAFORMA = new Set(["", "admin", "entrar", "api", "mototaxi"]);
const MINUTOS_CACHE = 5;
const dominios = new Map<string, { slug: string | null; hasta: number }>();

async function slugPorDominio(host: string): Promise<string | null> {
  const guardado = dominios.get(host);
  if (guardado && guardado.hasta > Date.now()) return guardado.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tiendas?select=slug&dominio=eq.${encodeURIComponent(host)}&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    if (res.ok) {
      const filas = (await res.json()) as { slug: string }[];
      slug = filas[0]?.slug ?? null;
    } else if (guardado) {
      return guardado.slug;
    }
  } catch {
    if (guardado) return guardado.slug;
  }
  dominios.set(host, { slug, hasta: Date.now() + MINUTOS_CACHE * 60_000 });
  return slug;
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase().replace(/^www\./, "");
  const ruta = request.nextUrl.pathname;

  let slug: string | null = null;
  let base = "";
  let rutaInterna = ruta;
  if (supabaseConfigurado && host && !HOSTS_SIN_DOMINIO.test(host)) slug = await slugPorDominio(host);

  const primera = ruta.split("/")[1] ?? "";
  const esPlataforma = !slug && RUTAS_PLATAFORMA.has(primera);
  if (slug && primera === "api") {
    // Los contadores (/api/contar) son de la plataforma también en los dominios propios
  } else if (slug) {
    // Dominio propio: los enlaces no llevan la dirección de la tienda
    rutaInterna = `/${slug}${ruta === "/" ? "" : ruta}`;
  } else if (!esPlataforma) {
    base = `/${primera}`;
  }

  const siguiente = () => {
    const cabeceras = new Headers(request.headers);
    cabeceras.set("x-base", base);
    if (rutaInterna === ruta) return NextResponse.next({ request: { headers: cabeceras } });
    const url = request.nextUrl.clone();
    url.pathname = rutaInterna;
    return NextResponse.rewrite(url, { request: { headers: cabeceras } });
  };

  let response = siguiente();
  const zonaPanel = esPlataforma && (primera === "admin" || primera === "entrar");
  const zonaTienda = !esPlataforma && /^\/[^/]+\/(admin|entrar)(\/|$)/.test(rutaInterna);
  if (!supabaseConfigurado || !(zonaPanel || zonaTienda)) return response;

  // Refresca la sesión (cookies) en las zonas con inicio de sesión
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = siguiente();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (data.user) return response;

  const destino = zonaPanel
    ? primera === "admin" && "/entrar"
    : /^\/[^/]+\/admin(\/|$)/.test(rutaInterna) && `${base}/entrar`;
  if (!destino) return response;
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  url.host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return NextResponse.redirect(url);
}

export const config = {
  // Todo menos archivos internos de Next.js y archivos con extensión (imágenes, íconos)
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
