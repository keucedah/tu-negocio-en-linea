// Publicidad pagada en tu panel (2.5).
import { supabaseConfigurado } from "../config";
import { crearClienteServidor } from "../supabase/server";
import type { Publicidad } from "./types";

/** null = falta ejecutar el SQL de la 2.5. */
export async function obtenerPublicidades(): Promise<Publicidad[] | null> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("publicidad")
    .select(
      "id, anunciante_tienda_id, anunciante_nombre, tipo_negocio_id, tipo_negocio_otro, titulo, texto, imagen_url, imagen_path, enlace_url, boton_texto, municipio_id, precio, activo, inicia, termina, vistas, clics, creado_en",
    )
    .order("id", { ascending: false });
  if (error) return null;
  return data.map((p) => ({
    ...p,
    id: Number(p.id),
    anunciante_tienda_id: p.anunciante_tienda_id == null ? null : Number(p.anunciante_tienda_id),
    tipo_negocio_id: p.tipo_negocio_id == null ? null : Number(p.tipo_negocio_id),
    municipio_id: p.municipio_id == null ? null : Number(p.municipio_id),
    precio: p.precio == null ? null : Number(p.precio),
  }));
}

export type TiendaAnunciante = { id: number; nombre: string; activa: boolean; tipo: string };

/** Tiendas que pueden anunciarse, con su tipo de negocio. */
export async function obtenerTiendasAnunciantes(): Promise<TiendaAnunciante[]> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("tiendas")
    .select("id, nombre_tienda, activa, tipo_negocio_otro, tipo:tipos_negocio(nombre)")
    .order("nombre_tienda");
  return (data ?? []).map((t) => {
    const tipo = t.tipo as unknown as { nombre: string } | null;
    return { id: Number(t.id), nombre: t.nombre_tienda, activa: t.activa, tipo: t.tipo_negocio_otro || tipo?.nombre || "" };
  });
}
