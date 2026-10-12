// Anuncios que se muestran en las tiendas (con caché, se borra al guardar un anuncio).
import { unstable_cache } from "next/cache";
import { supabaseConfigurado } from "./config";
import { crearClientePublico } from "./supabase/publico";
import { SEGUNDOS_CACHE, TAG_PLATAFORMA } from "./cache";
import { obtenerAjustes } from "./panel/datos";
import { numeroWhatsApp } from "./telefono";

export type AnuncioPublico = {
  id: number;
  titulo: string;
  texto: string;
  imagenes: string[];
  video_url: string;
  boton_texto: string;
  boton_url: string;
};

const vigentes = unstable_cache(
  async (tiendaId: number): Promise<AnuncioPublico[]> => {
    // La base de datos solo entrega los activos y dentro de sus fechas
    const { data, error } = await crearClientePublico()
      .from("anuncios")
      .select("id, titulo, texto, imagenes, video_url, boton_texto, boton_url")
      .or(`tiendas.eq.{},tiendas.cs.{${tiendaId}}`)
      .order("orden")
      .order("id", { ascending: false })
      .limit(10);
    if (error) return []; // Sin la tabla (falta el SQL 2.3) la tienda sigue funcionando
    return data;
  },
  ["anuncios-tienda"],
  { tags: [TAG_PLATAFORMA], revalidate: SEGUNDOS_CACHE },
);

const deInicio = unstable_cache(
  async (): Promise<AnuncioPublico[]> => {
    const { data, error } = await crearClientePublico()
      .from("anuncios")
      .select("id, titulo, texto, imagenes, video_url, boton_texto, boton_url")
      .eq("en_inicio", true)
      .order("orden")
      .order("id", { ascending: false })
      .limit(10);
    if (error) return [];
    return data;
  },
  ["anuncios-inicio"],
  { tags: [TAG_PLATAFORMA], revalidate: SEGUNDOS_CACHE },
);

/** Anuncios marcados para tu página principal. */
export async function obtenerAnunciosInicio(): Promise<{ anuncios: AnuncioPublico[]; whatsapp: string }> {
  if (!supabaseConfigurado) return { anuncios: [], whatsapp: "" };
  const [anuncios, ajustes] = await Promise.all([deInicio(), obtenerAjustes()]);
  return { anuncios, whatsapp: numeroWhatsApp(ajustes.codigo_pais, ajustes.celular) };
}

/** Anuncios de una tienda y el WhatsApp de la plataforma para el botón "Quiero participar". */
export async function obtenerAnunciosTienda(tiendaId: number): Promise<{ anuncios: AnuncioPublico[]; whatsapp: string }> {
  if (!supabaseConfigurado) return { anuncios: [], whatsapp: "" };
  const [anuncios, ajustes] = await Promise.all([vigentes(tiendaId), obtenerAjustes()]);
  return { anuncios, whatsapp: numeroWhatsApp(ajustes.codigo_pais, ajustes.celular) };
}
