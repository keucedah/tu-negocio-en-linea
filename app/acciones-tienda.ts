"use server";

import { revalidatePath } from "next/cache";
import { refrescarCache } from "@/lib/cache";
import { redirect } from "next/navigation";
import { obtenerAdminTienda } from "@/lib/supabase/server";
import { normalizarCelular } from "@/lib/telefono";
import { obtenerBase } from "@/lib/tienda/datos";
import { normalizarColor } from "@/lib/tema";
import { leerPrecio } from "@/lib/precio";
import { limpiarTallas } from "@/lib/tallas";

export type Resultado = { ok: boolean; mensaje: string } | null;

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_BYTES_MINI = 1024 * 1024;
const BUCKET = "imagenes";
const MAX_DESTACADOS = 12;

// Todas las acciones reciben la tienda: solo su dueño (o el administrador del panel) puede usarlas.
// La base de datos vuelve a comprobarlo con sus reglas (RLS).
async function exigirAdmin(tiendaId: number) {
  if (!Number.isInteger(tiendaId) || tiendaId <= 0) throw new Error("Tienda no válida");
  const { supabase, esAdmin } = await obtenerAdminTienda(tiendaId);
  if (!esAdmin) throw new Error("No autorizado");
  return supabase;
}

function leerProducto(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const categoria = Number(formData.get("categoria_id"));
  const imagen = formData.get("imagen");
  const archivo = imagen instanceof File && imagen.size > 0 ? imagen : null;
  const destacado = formData.get("destacado") === "on";
  // Precio opcional: solo cuenta si el dueño marcó "Mostrar precio"
  const precio = formData.get("con_precio") === "on" ? leerPrecio(String(formData.get("precio") ?? "")) : null;
  // Tallas o medidas: solo si el dueño marcó "Tiene tallas" (o medidas…); llegan como lista en JSON
  let tallas: string[] = [];
  const conTallas = formData.get("con_tallas") === "on";
  if (conTallas) {
    try {
      tallas = limpiarTallas(JSON.parse(String(formData.get("tallas") ?? "[]")));
    } catch {
      tallas = [];
    }
  }
  // Foto pequeña para la lista (la hace el navegador). Si falta o no sirve, la lista usa la grande.
  const mini = formData.get("imagen_mini");
  const archivoMini =
    archivo && mini instanceof File && mini.size > 0 && mini.size <= MAX_BYTES_MINI && TIPOS.includes(mini.type) && mini.size < archivo.size
      ? mini
      : null;
  return { nombre, descripcion, categoria_id: Number.isInteger(categoria) && categoria > 0 ? categoria : null, archivo, archivoMini, destacado, precio, tallas, conTallas };
}

/** Sube la foto y, si hay, su versión pequeña. */
async function subirFotos(supabase: Awaited<ReturnType<typeof exigirAdmin>>, tiendaId: number, archivo: File, mini: File | null) {
  const grande = await subirImagen(supabase, tiendaId, archivo);
  let chica: { imagen_path: string; imagen_url: string } | null = null;
  if (mini) {
    try {
      chica = await subirImagen(supabase, tiendaId, mini);
    } catch {
      chica = null; // Sin la pequeña la tienda usa la grande: no se pierde la foto
    }
  }
  return {
    imagen_path: grande.imagen_path,
    imagen_url: grande.imagen_url,
    imagen_mini_path: chica?.imagen_path ?? null,
    imagen_mini_url: chica?.imagen_url ?? null,
  };
}

const rutas = (...p: (string | null | undefined)[]) => p.filter((x): x is string => Boolean(x));

function validarImagen(archivo: File | null): string | null {
  if (!archivo) return null;
  if (!TIPOS.includes(archivo.type)) return "La imagen debe ser JPG, PNG, WEBP o GIF.";
  if (archivo.size > MAX_BYTES) return "La imagen no puede pesar más de 5 MB.";
  return null;
}

// Las imágenes de cada tienda van en su carpeta: "5/abc.webp", "5/marca/logo.png".
async function subirImagen(
  supabase: Awaited<ReturnType<typeof exigirAdmin>>,
  tiendaId: number,
  archivo: File,
  carpeta = "",
) {
  const ext = archivo.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${tiendaId}/${carpeta}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, archivo, { contentType: archivo.type });
  if (error) throw new Error("No se pudo subir la imagen: " + error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { imagen_path: path, imagen_url: data.publicUrl };
}

/** Lugar del siguiente producto destacado: al final del carrusel. */
async function siguienteOrden(supabase: Awaited<ReturnType<typeof exigirAdmin>>, tiendaId: number): Promise<number> {
  const { data } = await supabase
    .from("productos")
    .select("orden_destacado")
    .eq("tienda_id", tiendaId)
    .eq("destacado", true)
    .order("orden_destacado", { ascending: false })
    .limit(1)
    .maybeSingle();
  return Math.min(32000, (data?.orden_destacado ?? 0) + 1);
}

export async function crearProducto(tiendaId: number, _prev: Resultado, formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin(tiendaId);
    const { nombre, descripcion, categoria_id, archivo, archivoMini, destacado, precio, tallas, conTallas } = leerProducto(formData);
    if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };
    if (precio === "invalido") return { ok: false, mensaje: "Escribe el precio solo con números, por ejemplo 150 o 1250.50." };
    if (conTallas && tallas.length === 0) return { ok: false, mensaje: "Marca o escribe al menos una talla o medida, o quita la casilla “Tiene…” de ese cuadro." };
    if (!categoria_id) return { ok: false, mensaje: "Elige una categoría." };
    if (!archivo) return { ok: false, mensaje: "Sube una imagen del producto." };
    const errImg = validarImagen(archivo);
    if (errImg) return { ok: false, mensaje: errImg };

    const imagen = await subirFotos(supabase, tiendaId, archivo, archivoMini);
    const { error } = await supabase
      .from("productos")
      .insert({
        tienda_id: tiendaId,
        nombre,
        descripcion,
        categoria_id,
        precio,
        tallas,
        destacado,
        orden_destacado: destacado ? await siguienteOrden(supabase, tiendaId) : 0,
        ...imagen,
      });
    if (error) {
      await supabase.storage.from(BUCKET).remove(rutas(imagen.imagen_path, imagen.imagen_mini_path));
      return { ok: false, mensaje: error.code === "P0001" ? error.message : "No se pudo guardar: " + error.message };
    }
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: `“${nombre}” se agregó al catálogo.` };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function actualizarProducto(tiendaId: number, _prev: Resultado, formData: FormData): Promise<Resultado> {
  let exito = false;
  try {
    const supabase = await exigirAdmin(tiendaId);
    const id = Number(formData.get("id"));
    const { nombre, descripcion, categoria_id, archivo, archivoMini, destacado, precio, tallas, conTallas } = leerProducto(formData);
    if (!nombre) return { ok: false, mensaje: "El nombre es obligatorio." };
    if (precio === "invalido") return { ok: false, mensaje: "Escribe el precio solo con números, por ejemplo 150 o 1250.50." };
    if (conTallas && tallas.length === 0) return { ok: false, mensaje: "Marca o escribe al menos una talla o medida, o quita la casilla “Tiene…” de ese cuadro." };
    if (!categoria_id) return { ok: false, mensaje: "Elige una categoría." };
    const errImg = validarImagen(archivo);
    if (errImg) return { ok: false, mensaje: errImg };

    const { data: actual } = await supabase
      .from("productos")
      .select("imagen_path, imagen_mini_path, destacado")
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .maybeSingle();
    if (!actual) return { ok: false, mensaje: "Ese producto no existe en esta tienda." };
    const cambios: Record<string, unknown> = { nombre, descripcion, categoria_id, precio, tallas, destacado };
    if (destacado && !actual.destacado) cambios.orden_destacado = await siguienteOrden(supabase, tiendaId);
    if (archivo) Object.assign(cambios, await subirFotos(supabase, tiendaId, archivo, archivoMini));

    const { error } = await supabase.from("productos").update(cambios).eq("id", id).eq("tienda_id", tiendaId);
    if (error) return { ok: false, mensaje: error.code === "P0001" ? error.message : "No se pudo guardar: " + error.message };
    const viejas = rutas(actual.imagen_path, actual.imagen_mini_path);
    if (archivo && viejas.length) await supabase.storage.from(BUCKET).remove(viejas);
    revalidatePath("/", "layout");
    refrescarCache();
    exito = true;
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
  if (exito) redirect(`${await obtenerBase()}/admin`);
  return null;
}

export async function eliminarProducto(tiendaId: number, formData: FormData) {
  const supabase = await exigirAdmin(tiendaId);
  const id = Number(formData.get("id"));
  const { data } = await supabase
    .from("productos")
    .select("imagen_path, imagen_mini_path")
    .eq("id", id)
    .eq("tienda_id", tiendaId)
    .maybeSingle();
  if (!data) return;
  await supabase.from("productos").delete().eq("id", id).eq("tienda_id", tiendaId);
  const fotos = rutas(data.imagen_path, data.imagen_mini_path);
  if (fotos.length) await supabase.storage.from(BUCKET).remove(fotos);
  revalidatePath("/", "layout");
  refrescarCache();
}

export async function crearCategoria(tiendaId: number, _prev: Resultado, formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin(tiendaId);
    const nombre = String(formData.get("nombre") ?? "").trim();
    if (!nombre) return { ok: false, mensaje: "Escribe el nombre de la categoría." };
    const { error } = await supabase.from("categorias").insert({ tienda_id: tiendaId, nombre });
    if (error) return { ok: false, mensaje: error.code === "23505" ? "Esa categoría ya existe." : error.message };
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: `Categoría “${nombre}” creada.` };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
}

export async function eliminarCategoria(tiendaId: number, formData: FormData) {
  const supabase = await exigirAdmin(tiendaId);
  await supabase.from("categorias").delete().eq("id", Number(formData.get("id"))).eq("tienda_id", tiendaId);
  revalidatePath("/", "layout");
  refrescarCache();
}

export async function guardarConfiguracion(tiendaId: number, _prev: Resultado, formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin(tiendaId);
    const nombre_tienda = String(formData.get("nombre_tienda") ?? "").trim();
    if (!nombre_tienda) return { ok: false, mensaje: "Escribe el nombre de la tienda." };
    if (nombre_tienda.length > 60) return { ok: false, mensaje: "El nombre puede tener hasta 60 caracteres." };

    const cel = normalizarCelular(String(formData.get("codigo_pais") ?? ""), String(formData.get("celular") ?? ""));
    if (!cel.ok) return { ok: false, mensaje: cel.error };

    const logo = formData.get("logo");
    const archivo = logo instanceof File && logo.size > 0 ? logo : null;
    const errImg = validarImagen(archivo);
    if (errImg) return { ok: false, mensaje: errImg.replace("La imagen", "El logo") };
    const quitarLogo = formData.get("quitar_logo") === "on";

    const { data: actual } = await supabase.from("tiendas").select("logo_path").eq("id", tiendaId).maybeSingle();
    const cambios: Record<string, unknown> = {
      nombre_tienda,
      codigo_pais: cel.codigo,
      celular: cel.nacional,
      actualizado_en: new Date().toISOString(),
    };
    if (archivo) {
      const subida = await subirImagen(supabase, tiendaId, archivo, "marca/");
      cambios.logo_url = subida.imagen_url;
      cambios.logo_path = subida.imagen_path;
    } else if (quitarLogo) {
      cambios.logo_url = null;
      cambios.logo_path = null;
    }

    const { error } = await supabase.from("tiendas").update(cambios).eq("id", tiendaId);
    if (error) return { ok: false, mensaje: "No se pudo guardar: " + error.message };
    if ((archivo || quitarLogo) && actual?.logo_path) await supabase.storage.from(BUCKET).remove([actual.logo_path]);
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Datos de la tienda guardados." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
}

// Lo más vendido (carrusel) ---------------------------------------------------

/** Marca o quita un producto del carrusel "Lo más vendido". */
export async function cambiarDestacado(tiendaId: number, formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin(tiendaId);
    const id = Number(formData.get("id"));
    const destacado = formData.get("destacado") === "1";
    const cambios: Record<string, unknown> = { destacado };
    if (destacado) cambios.orden_destacado = await siguienteOrden(supabase, tiendaId);
    const { error } = await supabase.from("productos").update(cambios).eq("id", id).eq("tienda_id", tiendaId);
    if (error) {
      return {
        ok: false,
        mensaje: error.code === "P0001" ? error.message : `No se pudo cambiar (máximo ${MAX_DESTACADOS} destacados).`,
      };
    }
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: destacado ? "Agregado a lo más vendido." : "Quitado de lo más vendido." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
}

/** Sube o baja un producto en el carrusel. */
export async function moverDestacado(tiendaId: number, formData: FormData) {
  const supabase = await exigirAdmin(tiendaId);
  const id = Number(formData.get("id"));
  const dir = formData.get("dir") === "arriba" ? -1 : 1;
  const { data } = await supabase
    .from("productos")
    .select("id, orden_destacado, creado_en")
    .eq("tienda_id", tiendaId)
    .eq("destacado", true)
    .order("orden_destacado")
    .order("creado_en", { ascending: false });
  const lista = data ?? [];
  const i = lista.findIndex((p) => p.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= lista.length) return;
  [lista[i], lista[j]] = [lista[j], lista[i]];
  // Se renumera toda la lista para que el orden quede limpio (1, 2, 3…)
  await Promise.all(
    lista.map((p, n) =>
      p.orden_destacado === n + 1
        ? null
        : supabase.from("productos").update({ orden_destacado: n + 1 }).eq("id", p.id).eq("tienda_id", tiendaId),
    ),
  );
  revalidatePath("/", "layout");
  refrescarCache();
}

// Apariencia: colores, banners y textos de la portada --------------------------

const MAX_BANNERS = 3;

export async function guardarApariencia(tiendaId: number, _prev: Resultado, formData: FormData): Promise<Resultado> {
  try {
    const supabase = await exigirAdmin(tiendaId);
    const color_principal = normalizarColor(String(formData.get("color_principal") ?? ""));
    const color_encabezado = normalizarColor(String(formData.get("color_encabezado") ?? ""));
    if (!color_principal || !color_encabezado) return { ok: false, mensaje: "Elige colores válidos (por ejemplo #ea580c)." };
    const texto = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);

    // Banners (hasta 3), en su orden. Cada uno tiene su imagen de computadora (4:1) y, si quiere, una para celular (2:1).
    // "banners_plan" dice para cada uno si la imagen ya estaba ({ url }) o es un archivo nuevo ({ nuevo: n } de "banners_archivos").
    type Ref = { url?: unknown; nuevo?: unknown } | null;
    let plan: { pc: Ref; movil: Ref }[];
    try {
      plan = JSON.parse(String(formData.get("banners_plan") ?? "[]"));
      if (!Array.isArray(plan)) throw new Error();
    } catch {
      return { ok: false, mensaje: "No se pudieron leer los banners. Recarga la página e intenta de nuevo." };
    }
    if (plan.length > MAX_BANNERS) return { ok: false, mensaje: `Máximo ${MAX_BANNERS} banners.` };
    const archivos = formData.getAll("banners_archivos").filter((a): a is File => a instanceof File && a.size > 0);
    for (const a of archivos) {
      const errImg = validarImagen(a);
      if (errImg) return { ok: false, mensaje: errImg.replace("La imagen", "El banner") };
    }

    // Lo que hay guardado (lee sin las columnas nuevas si falta ejecutar el SQL de la 2.4.1 o de la 2.4)
    type Banners = {
      banner_url: string | null;
      banner_path: string | null;
      banners_url?: string[];
      banners_path?: string[];
      banners_movil_url?: string[];
      banners_movil_path?: string[];
    };
    let nivel = 0; // 2 = tiene la 2.4.1, 1 = solo la 2.4, 0 = ninguna
    let actual: Banners | null = null;
    for (const [n, columnas] of [
      [2, "banner_url, banner_path, banners_url, banners_path, banners_movil_url, banners_movil_path"],
      [1, "banner_url, banner_path, banners_url, banners_path"],
      [0, "banner_url, banner_path"],
    ] as const) {
      const r = await supabase.from("tiendas").select(columnas).eq("id", tiendaId).maybeSingle();
      if (!r.error) {
        nivel = n;
        actual = r.data as Banners | null;
        break;
      }
    }
    const urlsAntes: string[] = actual?.banners_url?.length ? actual.banners_url : actual?.banner_url ? [actual.banner_url] : [];
    const rutasAntes: string[] = actual?.banners_path?.length ? actual.banners_path : actual?.banner_url ? [actual.banner_path ?? ""] : [];
    // Dirección → ruta en Storage de todas las imágenes que ya tenía (computadora y celular)
    const ruta = new Map<string, string>();
    urlsAntes.forEach((u, i) => ruta.set(u, rutasAntes[i] ?? ""));
    (actual?.banners_movil_url ?? []).forEach((u, i) => u && ruta.set(u, actual?.banners_movil_path?.[i] ?? ""));
    const rutasViejas = [...ruta.values()].filter(Boolean);

    if (nivel === 0 && plan.length > 1) {
      return { ok: false, mensaje: "Para usar varios banners falta ejecutar en Supabase el archivo actualizacion-2.4.sql." };
    }
    if (nivel < 2 && plan.some((b) => b?.movil)) {
      return { ok: false, mensaje: "Para la imagen de celular falta ejecutar en Supabase el archivo actualizacion-2.4.1.sql." };
    }

    // Sube cada archivo nuevo una sola vez
    const subidas = new Map<number, { imagen_url: string; imagen_path: string }>();
    const resolver = async (r: Ref): Promise<{ url: string; ruta: string } | null> => {
      if (!r) return null;
      if (typeof r.url === "string") return ruta.has(r.url) ? { url: r.url, ruta: ruta.get(r.url) ?? "" } : null;
      const n = Number(r.nuevo);
      if (!Number.isInteger(n) || !archivos[n]) return null;
      if (!subidas.has(n)) subidas.set(n, await subirImagen(supabase, tiendaId, archivos[n], "marca/"));
      const s = subidas.get(n)!;
      return { url: s.imagen_url, ruta: s.imagen_path };
    };
    const urls: string[] = [];
    const rutas: string[] = [];
    const movilUrls: string[] = [];
    const movilRutas: string[] = [];
    const quitarSubidas = async () => {
      const nuevas = [...subidas.values()].map((s) => s.imagen_path);
      if (nuevas.length) await supabase.storage.from(BUCKET).remove(nuevas);
    };
    try {
      for (const b of plan) {
        const pc = await resolver(b?.pc ?? null);
        if (!pc || urls.includes(pc.url)) continue; // Sin imagen de computadora no hay banner
        const movil = await resolver(b?.movil ?? null);
        urls.push(pc.url);
        rutas.push(pc.ruta);
        movilUrls.push(movil?.url ?? "");
        movilRutas.push(movil?.ruta ?? "");
      }
    } catch (e) {
      await quitarSubidas();
      throw e;
    }

    const cambios: Record<string, unknown> = {
      color_principal,
      color_encabezado,
      titulo_portada: texto("titulo_portada", 80),
      texto_portada: texto("texto_portada", 200),
      texto_buscador: texto("texto_buscador", 60),
      actualizado_en: new Date().toISOString(),
    };
    // El primero también va en banner_url: es el que usa la App
    cambios.banner_url = urls[0] ?? null;
    cambios.banner_path = rutas[0] || null;
    if (nivel >= 1) {
      cambios.banners_url = urls;
      cambios.banners_path = rutas;
      cambios.color_portada = normalizarColor(String(formData.get("color_portada") ?? ""));
    }
    if (nivel >= 2) {
      cambios.banners_movil_url = movilUrls;
      cambios.banners_movil_path = movilRutas;
    }

    const { error } = await supabase.from("tiendas").update(cambios).eq("id", tiendaId);
    if (error) {
      await quitarSubidas();
      return { ok: false, mensaje: "No se pudo guardar: " + error.message };
    }
    // Borra del almacenamiento las imágenes que se quitaron
    const quitados = rutasViejas.filter((r) => !rutas.includes(r) && !movilRutas.includes(r));
    if (quitados.length) await supabase.storage.from(BUCKET).remove(quitados);
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Apariencia guardada. Abre tu catálogo para verla." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." };
  }
}
