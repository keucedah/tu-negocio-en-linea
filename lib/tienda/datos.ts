import { cache } from "react";
import { headers } from "next/headers";
import { supabaseConfigurado } from "../config";
import { COLOR_ENCABEZADO, COLOR_PRINCIPAL } from "../tema";
import { categoriasDemo, productosDemo } from "./demo";
import { crearClienteServidor } from "../supabase/server";
import { formatearCelular, numeroWhatsApp } from "../telefono";
import type { Categoria, FilaTienda, Producto, Tienda, TipoNegocio } from "./types";

const COLUMNAS_PRODUCTO = "id, nombre, descripcion, categoria_id, imagen_url, imagen_path, destacado, orden_destacado, creado_en";
const COLUMNAS_TIENDA =
  "id, slug, nombre_tienda, logo_url, logo_path, codigo_pais, celular, activa, tipo_negocio_id, tipo_negocio_otro, " +
  "color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, banner_url, banner_path, " +
  "tipo:tipos_negocio(nombre, titulo_portada, texto_portada, texto_buscador)";

// Textos de la portada cuando ni la tienda ni su tipo de negocio tienen uno.
const PORTADA = {
  titulo: "Bienvenido a nuestra tienda",
  texto: "Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.",
  buscador: "Buscar producto por nombre…",
};

/**
 * Inicio de los enlaces de la tienda: "/ana" cuando se entra por dirección
 * (sitio.com/ana) y "" cuando se entra por su propio dominio (ana.com).
 * Lo calcula el middleware.
 */
export async function obtenerBase(): Promise<string> {
  return (await headers()).get("x-base") ?? "";
}

function demoTienda(slug: string): FilaTienda {
  return {
    id: 1,
    slug,
    nombre_tienda: "Tienda de ejemplo",
    logo_url: null,
    logo_path: null,
    codigo_pais: "504",
    celular: "88839869",
    activa: true,
    tipo_negocio_id: null,
    tipo_negocio_otro: "",
    color_principal: COLOR_PRINCIPAL,
    color_encabezado: COLOR_ENCABEZADO,
    titulo_portada: "Todo para tu obra y tu hogar",
    texto_portada: PORTADA.texto,
    texto_buscador: "",
    banner_url: null,
    banner_path: null,
    tipo: null,
  };
}

/** Fila de la tienda por su dirección. null si no existe. */
export const obtenerFilaTienda = cache(async (slug: string): Promise<FilaTienda | null> => {
  if (!supabaseConfigurado) return demoTienda(slug);
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("tiendas").select(COLUMNAS_TIENDA).eq("slug", slug).maybeSingle<FilaTienda>();
  return data;
});

export function aTienda(t: FilaTienda): Tienda {
  return {
    id: t.id,
    slug: t.slug,
    activa: t.activa,
    nombre: t.nombre_tienda,
    logoUrl: t.logo_url,
    celularFormateado: formatearCelular(t.codigo_pais, t.celular),
    whatsapp: numeroWhatsApp(t.codigo_pais, t.celular),
    colorPrincipal: t.color_principal || COLOR_PRINCIPAL,
    colorEncabezado: t.color_encabezado || COLOR_ENCABEZADO,
    tituloPortada: t.titulo_portada || t.tipo?.titulo_portada || PORTADA.titulo,
    textoPortada: t.texto_portada || t.tipo?.texto_portada || PORTADA.texto,
    textoBuscador: t.texto_buscador || t.tipo?.texto_buscador || PORTADA.buscador,
    bannerUrl: t.banner_url,
  };
}

export async function obtenerTienda(slug: string): Promise<Tienda | null> {
  const t = await obtenerFilaTienda(slug);
  return t ? aTienda(t) : null;
}

export async function obtenerCatalogo(tiendaId: number): Promise<{ categorias: Categoria[]; productos: Producto[] }> {
  if (!supabaseConfigurado) return { categorias: categoriasDemo, productos: productosDemo };

  const supabase = await crearClienteServidor();
  const [cats, productos] = await Promise.all([
    supabase.from("categorias").select("id, nombre").eq("tienda_id", tiendaId).order("nombre"),
    todosLosProductos(supabase, tiendaId),
  ]);
  if (cats.error) throw cats.error;
  return { categorias: cats.data, productos };
}

/** Productos del carrusel de arriba, en el orden que eligió el dueño. */
export function destacados(productos: Producto[]): Producto[] {
  return productos
    .filter((p) => p.destacado)
    .sort((a, b) => (a.orden_destacado ?? 0) - (b.orden_destacado ?? 0) || b.creado_en.localeCompare(a.creado_en));
}

// Supabase entrega como máximo 1000 filas por consulta: se piden por bloques.
const BLOQUE = 1000;

async function todosLosProductos(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  tiendaId: number,
): Promise<Producto[]> {
  const todos: Producto[] = [];
  for (let desde = 0; ; desde += BLOQUE) {
    const { data, error } = await supabase
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .eq("tienda_id", tiendaId)
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false })
      .range(desde, desde + BLOQUE - 1);
    if (error) throw error;
    todos.push(...data);
    if (data.length < BLOQUE) return todos;
  }
}

export async function obtenerProducto(
  tiendaId: number,
  id: number,
): Promise<{ producto: Producto | null; categoria: Categoria | null }> {
  if (!supabaseConfigurado) {
    const producto = productosDemo.find((p) => p.id === id) ?? null;
    const categoria = categoriasDemo.find((c) => c.id === producto?.categoria_id) ?? null;
    return { producto, categoria };
  }
  const supabase = await crearClienteServidor();
  const { data: producto } = await supabase
    .from("productos")
    .select(COLUMNAS_PRODUCTO)
    .eq("tienda_id", tiendaId)
    .eq("id", id)
    .maybeSingle();
  if (!producto?.categoria_id) return { producto, categoria: null };
  const { data: categoria } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("id", producto.categoria_id)
    .maybeSingle();
  return { producto, categoria };
}

export async function obtenerCategorias(tiendaId: number): Promise<Categoria[]> {
  if (!supabaseConfigurado) return categoriasDemo;
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("categorias").select("id, nombre").eq("tienda_id", tiendaId).order("nombre");
  if (error) throw error;
  return data;
}

/** Tipos de negocio con sus textos y colores sugeridos. */
export const obtenerTiposNegocio = cache(async (): Promise<TipoNegocio[]> => {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("tipos_negocio")
    .select("id, nombre, color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, categorias, orden, activo")
    .order("orden")
    .order("nombre");
  return data ?? [];
});
