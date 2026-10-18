import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { supabaseConfigurado } from "@/lib/config";
import { crearClientePublico } from "@/lib/supabase/publico";
import { HOST_SITIO, SITIO, urlTienda } from "@/lib/seo";

// sitemap.xml automático: la página principal, cada tienda activa y sus productos.
// Se arma al momento, así una tienda o un producto nuevo aparece sin tocar nada.
// En el dominio propio de una tienda (ana.com/sitemap.xml) lista solo esa tienda.

const MAX_URLS = 45000; // Google acepta hasta 50 000 por sitemap
const BLOQUE = 1000;

type FilaTienda = { id: number; slug: string; dominio: string | null; actualizado_en: string | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(":")[0].toLowerCase().replace(/^www\./, "");
  const plataforma = !host || host === HOST_SITIO || /^(localhost|127\.0\.0\.1)$|\.vercel\.app$/.test(host);
  const urls: MetadataRoute.Sitemap = plataforma
    ? [
        { url: SITIO + "/", changeFrequency: "weekly", priority: 1 },
        { url: SITIO + "/privacidad", changeFrequency: "yearly", priority: 0.2 },
        { url: SITIO + "/terminos", changeFrequency: "yearly", priority: 0.2 },
      ]
    : [];
  if (!supabaseConfigurado) return urls;

  const supabase = crearClientePublico();
  let consulta = supabase.from("tiendas").select("id, slug, dominio, actualizado_en").eq("activa", true).order("id");
  // En la plataforma van las tiendas sin dominio propio; las que tienen uno se listan en su dominio
  consulta = plataforma ? consulta.is("dominio", null) : consulta.eq("dominio", host);
  const { data: tiendas, error } = await consulta.returns<FilaTienda[]>();
  if (error || !tiendas?.length) return urls;

  const porId = new Map(tiendas.map((t) => [t.id, t]));
  for (const t of tiendas) {
    urls.push({ url: urlTienda(t), lastModified: t.actualizado_en ?? undefined, changeFrequency: "daily", priority: 0.8 });
  }

  // Productos de esas tiendas, por bloques de 1000
  for (let desde = 0; urls.length < MAX_URLS; desde += BLOQUE) {
    const { data, error: e } = await supabase
      .from("productos")
      .select("id, tienda_id, creado_en")
      .in("tienda_id", [...porId.keys()])
      .order("id")
      .range(desde, desde + BLOQUE - 1);
    if (e || !data?.length) break;
    for (const p of data) {
      const t = porId.get(p.tienda_id);
      if (t && urls.length < MAX_URLS) urls.push({ url: urlTienda(t, `/producto/${p.id}`), lastModified: p.creado_en, priority: 0.6 });
    }
    if (data.length < BLOQUE) break;
  }
  return urls;
}
