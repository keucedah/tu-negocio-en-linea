import { cache } from "react";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { SEGUNDOS_CACHE, TAG_CATALOGO } from "../cache";
import { crearClientePublico } from "../supabase/publico";
import { supabaseConfigurado } from "../config";
import { COLOR_ENCABEZADO, COLOR_PRINCIPAL } from "../tema";
import { categoriasDemo, productosDemo } from "./demo";
import { crearClienteServidor } from "../supabase/server";
import { formatearCelular, numeroWhatsApp } from "../telefono";
import type { Categoria, FilaTienda, Producto, Tienda, TipoNegocio } from "./types";
import { POR_PAGINA, normalizar, type Filtros, type Orden } from "./filtros";

export { leerFiltros } from "./filtros";

const COLUMNAS_PRODUCTO =
  "id, nombre, descripcion, categoria_id, imagen_url, imagen_path, imagen_mini_url, precio, tallas, destacado, orden_destacado, creado_en";
const COLUMNAS_BASE =
  "id, slug, nombre_tienda, logo_url, logo_path, codigo_pais, celular, activa, tipo_negocio_id, tipo_negocio_otro, " +
  "color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, banner_url, banner_path, " +
  "tipo:tipos_negocio(nombre, titulo_portada, texto_portada, texto_buscador)";
const COLUMNAS_24 = COLUMNAS_BASE + ", banners_url, banners_path, color_portada";
const COLUMNAS_TIENDA = COLUMNAS_24 + ", banners_movil_url, banners_movil_path";

type Consulta = ReturnType<typeof crearClientePublico>;

/** Lee la fila de la tienda. Si todavía no se ejecutó el SQL de la 2.4.1 o de la 2.4, lee sin esas columnas. */
async function leerFila(supabase: Consulta, slug: string): Promise<FilaTienda | null> {
  for (const columnas of [COLUMNAS_TIENDA, COLUMNAS_24, COLUMNAS_BASE]) {
    const r = await supabase.from("tiendas").select(columnas).eq("slug", slug).maybeSingle<FilaTienda>();
    if (r.error?.code === "42703") continue; // Falta una columna nueva: prueba sin ella
    if (r.error) throw r.error;
    return r.data;
  }
  return null;
}

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
  try {
    return await leerFila(supabase as unknown as Consulta, slug);
  } catch {
    return null;
  }
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
    colorPortada: t.color_portada ?? "",
    banners: (t.banners_url?.length ? t.banners_url.slice(0, 3) : t.banner_url ? [t.banner_url] : []).map((pc, i) => ({
      pc,
      movil: t.banners_movil_url?.[i] ?? "",
    })),
  };
}

export async function obtenerTienda(slug: string): Promise<Tienda | null> {
  const t = await obtenerFilaTienda(slug);
  return t ? aTienda(t) : null;
}

// --- Lo que ve el visitante: mismas consultas, sin sesión y guardadas en caché ---
const opcionesCache = { tags: [TAG_CATALOGO], revalidate: SEGUNDOS_CACHE };

const filaPublica = unstable_cache(
  async (slug: string): Promise<FilaTienda | null> => {
    return leerFila(crearClientePublico(), slug);
  },
  ["tienda-publica"],
  opcionesCache,
);

/** Tienda para las páginas públicas (con caché). */
export const obtenerTiendaPublica = cache(async (slug: string): Promise<Tienda | null> => {
  const t = supabaseConfigurado ? await filaPublica(slug) : demoTienda(slug);
  return t ? aTienda(t) : null;
});

const categoriasPublicas = unstable_cache(
  async (tiendaId: number): Promise<Categoria[]> => {
    const { data, error } = await crearClientePublico().from("categorias").select("id, nombre").eq("tienda_id", tiendaId).order("nombre");
    if (error) throw error;
    return data;
  },
  ["categorias-publicas"],
  opcionesCache,
);

/** Cuántos productos tiene cada categoría (clave 0 = sin categoría). */
const conteoPublico = unstable_cache(
  async (tiendaId: number): Promise<Record<number, number>> => {
    const { data, error } = await crearClientePublico().rpc("conteo_categorias", { t: tiendaId });
    if (error) throw error;
    const conteo: Record<number, number> = {};
    for (const f of data as { categoria_id: number | null; total: number }[]) conteo[f.categoria_id ?? 0] = Number(f.total);
    return conteo;
  },
  ["conteo-categorias"],
  opcionesCache,
);

const destacadosPublicos = unstable_cache(
  async (tiendaId: number): Promise<Producto[]> => {
    const { data, error } = await crearClientePublico()
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .eq("tienda_id", tiendaId)
      .eq("destacado", true)
      .order("orden_destacado")
      .order("creado_en", { ascending: false });
    if (error) throw error;
    return data;
  },
  ["destacados-publicos"],
  opcionesCache,
);

type Pagina = { productos: Producto[]; encontrados: number };

const paginaPublica = unstable_cache(
  async (tiendaId: number, q: string, categoria: number | null, orden: Orden, pagina: number): Promise<Pagina> => {
    let consulta = crearClientePublico()
      .from("productos")
      .select(COLUMNAS_PRODUCTO, { count: "exact" })
      .eq("tienda_id", tiendaId);
    if (categoria) consulta = consulta.eq("categoria_id", categoria);
    // Sin comodines ni signos que PostgREST interpreta
    const texto = normalizar(q).replace(/[%_*,()\\."]/g, " ").trim();
    if (texto) consulta = consulta.ilike("nombre_busqueda", `%${texto}%`);
    if (orden === "recientes") consulta = consulta.order("creado_en", { ascending: false }).order("id", { ascending: false });
    else consulta = consulta.order("nombre_busqueda", { ascending: orden === "az" }).order("id");
    const desde = (pagina - 1) * POR_PAGINA;
    const { data, count, error } = await consulta.range(desde, desde + POR_PAGINA - 1);
    // Pedir una página que ya no existe (por ejemplo ?pagina=999) no es un error: llega vacía
    if (error && error.code !== "PGRST103") throw error;
    return { productos: data ?? [], encontrados: count ?? 0 };
  },
  ["pagina-catalogo"],
  opcionesCache,
);

export type CatalogoPagina = {
  categorias: Categoria[];
  conteo: Record<number, number>;
  total: number;
  destacados: Producto[];
  productos: Producto[];
  encontrados: number;
  filtros: Filtros;
};

/**
 * Lo que muestra la portada de la tienda: solo la página de productos que se está viendo
 * (24), ya filtrada por búsqueda y categoría en la base de datos. Así una tienda con
 * 10.000 productos pesa lo mismo que una con 50. Todo con caché.
 */
export async function obtenerPaginaCatalogo(tiendaId: number, filtros: Filtros): Promise<CatalogoPagina> {
  if (!supabaseConfigurado) return paginaDemo(filtros);
  const [categorias, conteo, top] = await Promise.all([categoriasPublicas(tiendaId), conteoPublico(tiendaId), destacadosPublicos(tiendaId)]);
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  let { productos, encontrados } = await paginaPublica(tiendaId, filtros.q, filtros.categoria, filtros.orden, filtros.pagina);
  // Página más allá de la última (por ejemplo ?pagina=999): se muestra la última
  let f = filtros;
  if (!productos.length && filtros.pagina > 1) {
    const primera = await paginaPublica(tiendaId, filtros.q, filtros.categoria, filtros.orden, 1);
    f = { ...filtros, pagina: Math.max(1, Math.ceil(primera.encontrados / POR_PAGINA)) };
    ({ productos, encontrados } = f.pagina === 1 ? primera : await paginaPublica(tiendaId, f.q, f.categoria, f.orden, f.pagina));
  }
  return { categorias, conteo, total, destacados: top, productos, encontrados, filtros: f };
}

function paginaDemo(filtros: Filtros): CatalogoPagina {
  const q = normalizar(filtros.q);
  const lista = productosDemo.filter(
    (p) => (filtros.categoria === null || p.categoria_id === filtros.categoria) && (!q || normalizar(p.nombre).includes(q)),
  );
  if (filtros.orden === "az") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  else if (filtros.orden === "za") lista.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
  const conteo: Record<number, number> = {};
  for (const p of productosDemo) conteo[p.categoria_id ?? 0] = (conteo[p.categoria_id ?? 0] ?? 0) + 1;
  const ultima = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const f = { ...filtros, pagina: Math.min(filtros.pagina, ultima) };
  const desde = (f.pagina - 1) * POR_PAGINA;
  return {
    categorias: categoriasDemo,
    conteo,
    total: productosDemo.length,
    destacados: destacados(productosDemo),
    productos: lista.slice(desde, desde + POR_PAGINA),
    encontrados: lista.length,
    filtros: f,
  };
}

const productoPublico = unstable_cache(
  async (tiendaId: number, id: number): Promise<Producto | null> => {
    const { data, error } = await crearClientePublico()
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .eq("tienda_id", tiendaId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  ["producto-publico"],
  opcionesCache,
);

/** Un producto para su página pública (con caché). */
export async function obtenerProductoPublico(
  tiendaId: number,
  id: number,
): Promise<{ producto: Producto | null; categoria: Categoria | null }> {
  if (!supabaseConfigurado) return obtenerProducto(tiendaId, id);
  const [producto, categorias] = await Promise.all([productoPublico(tiendaId, id), categoriasPublicas(tiendaId)]);
  const categoria = categorias.find((c) => c.id === producto?.categoria_id) ?? null;
  return { producto, categoria };
}

// --- Para el panel del dueño (con su sesión, sin caché) ---

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

export const POR_PAGINA_PANEL = 50;

/**
 * Datos del panel del dueño: categorías, cuántos productos tiene cada una, lo más vendido
 * y solo la página de productos que se está viendo (50), con búsqueda por nombre.
 * Con su sesión y sin caché, para que vea siempre lo último.
 */
export async function obtenerPanelProductos(tiendaId: number, q: string, pedida: number) {
  if (!supabaseConfigurado) {
    return { categorias: categoriasDemo, conteo: {} as Record<number, number>, total: 0, top: [] as Producto[], productos: [] as Producto[], encontrados: 0, pagina: 1 };
  }
  const supabase = await crearClienteServidor();
  const pedirPagina = async (pagina: number) => {
    let consulta = supabase.from("productos").select(COLUMNAS_PRODUCTO, { count: "exact" }).eq("tienda_id", tiendaId);
    const texto = normalizar(q).replace(/[%_*,()\\."]/g, " ").trim();
    if (texto) consulta = consulta.ilike("nombre_busqueda", `%${texto}%`);
    const desde = (pagina - 1) * POR_PAGINA_PANEL;
    const { data, count, error } = await consulta
      .order("creado_en", { ascending: false })
      .order("id", { ascending: false })
      .range(desde, desde + POR_PAGINA_PANEL - 1);
    if (error && error.code !== "PGRST103") throw error;
    return { productos: data ?? [], encontrados: count ?? 0 };
  };
  const [cats, conteoRpc, top, primera] = await Promise.all([
    supabase.from("categorias").select("id, nombre").eq("tienda_id", tiendaId).order("nombre"),
    supabase.rpc("conteo_categorias", { t: tiendaId }),
    supabase
      .from("productos")
      .select(COLUMNAS_PRODUCTO)
      .eq("tienda_id", tiendaId)
      .eq("destacado", true)
      .order("orden_destacado")
      .order("creado_en", { ascending: false }),
    pedirPagina(Math.max(1, pedida)),
  ]);
  if (cats.error) throw cats.error;
  if (conteoRpc.error) throw conteoRpc.error;
  if (top.error) throw top.error;
  const conteo: Record<number, number> = {};
  for (const f of conteoRpc.data as { categoria_id: number | null; total: number }[]) conteo[f.categoria_id ?? 0] = Number(f.total);
  let { productos, encontrados } = primera;
  let pagina = Math.max(1, pedida);
  if (!productos.length && pagina > 1) {
    const uno = await pedirPagina(1);
    pagina = Math.max(1, Math.ceil(uno.encontrados / POR_PAGINA_PANEL));
    ({ productos, encontrados } = pagina === 1 ? uno : await pedirPagina(pagina));
  }
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  return { categorias: cats.data as Categoria[], conteo, total, top: top.data as Producto[], productos, encontrados, pagina };
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
