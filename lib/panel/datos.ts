import { cache } from "react";
import { supabaseConfigurado } from "../config";
import { ajustesDemo, clientesDemo, pagosDemo, planesDemo, solicitudesDemo, tiposDemo } from "./demo";
import { unstable_cache } from "next/cache";
import { crearClienteServidor } from "../supabase/server";
import { crearClientePublico } from "../supabase/publico";
import { SEGUNDOS_CACHE, TAG_PLATAFORMA } from "../cache";
import type { Ajustes, Anuncio, Cliente, Pago, Plan, Solicitud, TipoNegocio } from "./types";

const COLUMNAS_AJUSTES =
  "nombre_negocio, eslogan, codigo_pais, celular, correo, direccion, precio_instalacion, precio_dominio, dias_aviso, plantilla_cobro, plantilla_vencido, plantilla_recibo";

// Postgres devuelve numeric como texto: se convierte a número.
const aPlan = (p: Plan): Plan => ({ ...p, precio_mensual: Number(p.precio_mensual) });

// Ajustes, planes visibles y tipos de negocio son públicos: se leen sin sesión y se guardan en caché.
const opcionesCache = { tags: [TAG_PLATAFORMA], revalidate: SEGUNDOS_CACHE };

const ajustesPublicos = unstable_cache(
  async () => (await crearClientePublico().from("ajustes_negocio").select(COLUMNAS_AJUSTES).eq("id", 1).maybeSingle()).data,
  ["ajustes"],
  opcionesCache,
);

export const obtenerAjustes = cache(async (): Promise<Ajustes> => {
  if (!supabaseConfigurado) return ajustesDemo;
  const data = await ajustesPublicos();
  if (!data) return ajustesDemo;
  return { ...data, precio_instalacion: Number(data.precio_instalacion), precio_dominio: Number(data.precio_dominio) };
});

const planesVisibles = unstable_cache(
  async (): Promise<Plan[]> => {
    const { data, error } = await crearClientePublico()
      .from("planes")
      .select("id, nombre, subtitulo, precio_mensual, limite_productos, caracteristicas, color, orden, visible")
      .eq("visible", true)
      .order("orden")
      .order("id");
    if (error) throw error;
    return data.map(aPlan);
  },
  ["planes-visibles"],
  opcionesCache,
);

/** Planes que ve el público en la página principal (con caché). */
export async function obtenerPlanesPublicos(): Promise<Plan[]> {
  return supabaseConfigurado ? planesVisibles() : planesDemo.filter((p) => p.visible);
}

/** Planes ordenados. Para el público solo llegan los visibles (lo controla la base de datos). */
export const obtenerPlanes = cache(async (): Promise<Plan[]> => {
  if (!supabaseConfigurado) return planesDemo;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("planes")
    .select("id, nombre, subtitulo, precio_mensual, limite_productos, caracteristicas, color, orden, visible")
    .order("orden")
    .order("id");
  if (error) throw error;
  return data.map(aPlan);
});

const COLUMNAS_CLIENTE =
  "id, negocio, contacto, codigo_pais, celular, correo, direccion, sitio_url, dominio, plan_id, con_dominio, limite_personalizado, cuota_personalizada, estado, fecha_inicio, proximo_pago, instalacion_pagada, notas, tipo_negocio_id, tipo_negocio_otro, tienda_id, creado_en";

const aCliente = (c: Cliente): Cliente => ({
  ...c,
  cuota_personalizada: c.cuota_personalizada == null ? null : Number(c.cuota_personalizada),
});
const aPago = (p: Pago): Pago => ({ ...p, monto: Number(p.monto), numero_recibo: Number(p.numero_recibo) });

export async function obtenerClientes(): Promise<Cliente[]> {
  if (!supabaseConfigurado) return clientesDemo;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("clientes").select(COLUMNAS_CLIENTE).order("negocio");
  if (error) throw error;
  return data.map(aCliente);
}

export async function obtenerCliente(id: number): Promise<Cliente | null> {
  if (!supabaseConfigurado) return clientesDemo.find((c) => c.id === id) ?? null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("clientes").select(COLUMNAS_CLIENTE).eq("id", id).maybeSingle();
  return data ? aCliente(data) : null;
}

export async function obtenerPagos(clienteId?: number): Promise<Pago[]> {
  if (!supabaseConfigurado) {
    const lista = clienteId ? pagosDemo.filter((p) => p.cliente_id === clienteId) : pagosDemo;
    return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("pagos")
    .select("id, cliente_id, fecha, monto, concepto, meses, metodo, nota, serie_recibo, numero_recibo, plan_nombre, pagado_hasta")
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });
  if (clienteId) q = q.eq("cliente_id", clienteId);
  else q = q.limit(1000);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(aPago);
}

export async function obtenerSolicitudes(): Promise<Solicitud[]> {
  if (!supabaseConfigurado) return solicitudesDemo;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("solicitudes_demo")
    .select("id, nombre, negocio, celular, mensaje, atendida, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

/** Tipos de negocio ordenados (todos; el formulario de clientes muestra solo los activos). */
const tiposPublicos = unstable_cache(
  async (): Promise<TipoNegocio[]> => {
    const { data, error } = await crearClientePublico()
      .from("tipos_negocio")
      .select("id, nombre, color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, categorias, orden, activo")
      .order("orden")
      .order("nombre");
    if (error) throw error;
    return data;
  },
  ["tipos"],
  opcionesCache,
);

export const obtenerTipos = cache(async (): Promise<TipoNegocio[]> => {
  if (!supabaseConfigurado) return tiposDemo;
  return tiposPublicos();
});

/** Nombre del tipo de negocio de un cliente ("Otro" muestra lo que se escribió). */
export function nombreTipo(c: Pick<Cliente, "tipo_negocio_id" | "tipo_negocio_otro">, tipos: TipoNegocio[]): string {
  return c.tipo_negocio_otro || tipos.find((t) => t.id === c.tipo_negocio_id)?.nombre || "";
}

/** Todos los anuncios (vigentes, programados, terminados y pausados) para el panel. */
export async function obtenerAnuncios(): Promise<Anuncio[]> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("anuncios")
    .select("id, titulo, texto, imagenes, rutas_imagenes, video_url, boton_texto, boton_url, tiendas, en_inicio, activo, inicia, termina, orden, creado_en")
    .order("orden")
    .order("id", { ascending: false });
  if (error) return []; // Falta ejecutar el SQL de la 2.3
  return data.map((a) => ({ ...a, tiendas: (a.tiendas ?? []).map(Number) }));
}

/** Tiendas para elegir dónde sale un anuncio. */
export async function obtenerTiendasLista(): Promise<{ id: number; nombre: string; activa: boolean }[]> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("tiendas").select("id, nombre_tienda, activa").order("nombre_tienda");
  return (data ?? []).map((t) => ({ id: Number(t.id), nombre: t.nombre_tienda, activa: t.activa }));
}
