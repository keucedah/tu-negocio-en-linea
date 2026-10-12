"use server";

import { revalidatePath } from "next/cache";
import { refrescarCache } from "@/lib/cache";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerAdminPanel } from "@/lib/supabase/server";
import { LADO_ANUNCIO, MAX_IMAGENES_ANUNCIO } from "@/lib/anunciosConfig";
import type { Resultado } from "./acciones";

const BUCKET = "imagenes";
const MAX_BYTES = 5 * 1024 * 1024;
const MODO_DEMO: Resultado = { ok: false, mensaje: "Modo demostración: conecta Supabase para guardar cambios." };

async function exigirAdmin() {
  const { supabase, esAdmin } = await obtenerAdminPanel();
  if (!esAdmin) throw new Error("No autorizado");
  return supabase;
}

const texto = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const fecha = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const enlaceSeguro = (v: string) => (v === "" || /^https:\/\/[^\s]+$/i.test(v) ? v : null);

/**
 * Deja la imagen siempre en WebP y con el lado más largo de 1600 px.
 * El navegador ya la manda optimizada; aquí se asegura (por ejemplo, iPhone manda JPG).
 */
async function aWebp(archivo: File): Promise<Buffer> {
  const original = Buffer.from(await archivo.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(original)
      .rotate()
      .resize({ width: LADO_ANUNCIO, height: LADO_ANUNCIO, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    if (archivo.type === "image/webp") return original;
    throw new Error("No se pudo convertir la imagen a WebP. Prueba con otra imagen.");
  }
}

export async function guardarAnuncio(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  const subidas: string[] = [];
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;

    const titulo = texto(f, "titulo", 80);
    if (!titulo) return { ok: false, mensaje: "Escribe el título del anuncio." };
    const tipo = String(f.get("tipo")) === "video" ? "video" : "imagenes";
    const video_url = tipo === "video" ? enlaceSeguro(texto(f, "video_url", 300)) : "";
    if (video_url === null) return { ok: false, mensaje: "El enlace del video debe empezar con https://" };
    if (tipo === "video" && !video_url) return { ok: false, mensaje: "Pega el enlace del video." };
    const boton_url = enlaceSeguro(texto(f, "boton_url", 300));
    if (boton_url === null) return { ok: false, mensaje: "El enlace del botón debe empezar con https://" };
    const inicia = fecha(f, "inicia");
    const termina = fecha(f, "termina");
    if (inicia && termina && termina < inicia) return { ok: false, mensaje: "La fecha de fin no puede ser antes de la de inicio." };
    const tiendas =
      String(f.get("donde")) === "elegidas"
        ? [...new Set(f.getAll("tiendas").map(Number).filter((n) => Number.isInteger(n) && n > 0))]
        : [];
    if (String(f.get("donde")) === "elegidas" && tiendas.length === 0) return { ok: false, mensaje: "Elige al menos una tienda o marca “Todas las tiendas”." };

    // Imágenes que ya tenía y se quedan (en el orden en que están)
    const anterior = id
      ? (await supabase.from("anuncios").select("imagenes, rutas_imagenes").eq("id", id).maybeSingle<{ imagenes: string[]; rutas_imagenes: string[] }>()).data
      : null;
    if (id && !anterior) return { ok: false, mensaje: "No se encontró el anuncio." };
    const conservar = new Set(f.getAll("conservar").map(String));
    const imagenes: string[] = [];
    const rutas: string[] = [];
    anterior?.imagenes.forEach((url, i) => {
      if (tipo === "imagenes" && conservar.has(url)) {
        imagenes.push(url);
        rutas.push(anterior.rutas_imagenes[i] ?? "");
      }
    });

    // Imágenes nuevas, siempre en WebP
    const nuevas = tipo === "imagenes" ? (f.getAll("nuevas") as File[]).filter((a) => a && a.size > 0) : [];
    if (imagenes.length + nuevas.length > MAX_IMAGENES_ANUNCIO) return { ok: false, mensaje: `Máximo ${MAX_IMAGENES_ANUNCIO} imágenes por anuncio.` };
    for (const archivo of nuevas) {
      if (!archivo.type.startsWith("image/")) return { ok: false, mensaje: "Solo se aceptan imágenes." };
      if (archivo.size > MAX_BYTES) return { ok: false, mensaje: "Cada imagen debe pesar menos de 5 MB." };
    }
    for (const archivo of nuevas) {
      const webp = await aWebp(archivo);
      const ruta = `anuncios/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(ruta, webp, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) throw new Error("No se pudo subir una imagen: " + error.message);
      subidas.push(ruta);
      imagenes.push(supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl);
      rutas.push(ruta);
    }
    if (tipo === "imagenes" && imagenes.length === 0) return limpiarYResponder(supabase, subidas, "Sube al menos una imagen o elige “Video”.");

    const datos = {
      titulo,
      texto: texto(f, "texto", 1000),
      imagenes,
      rutas_imagenes: rutas,
      video_url,
      boton_texto: texto(f, "boton_texto", 30),
      boton_url,
      tiendas,
      en_inicio: f.get("en_inicio") === "on",
      activo: f.get("activo") === "on",
      inicia,
      termina,
      orden: Math.max(-999, Math.min(999, Math.round(Number(f.get("orden")) || 0))),
    };
    const { error } = id ? await supabase.from("anuncios").update(datos).eq("id", id) : await supabase.from("anuncios").insert(datos);
    if (error) return limpiarYResponder(supabase, subidas, "No se pudo guardar: " + error.message);

    // Borra del almacenamiento las imágenes que se quitaron
    const quitadas = (anterior?.rutas_imagenes ?? []).filter((r) => r && !rutas.includes(r));
    if (quitadas.length) await supabase.storage.from(BUCKET).remove(quitadas);

    revalidatePath("/admin/anuncios");
    refrescarCache();
    return { ok: true, mensaje: id ? "Anuncio guardado." : "Anuncio creado. Ya sale en las tiendas." };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error al guardar.";
    if (subidas.length) {
      try {
        const supabase = await exigirAdmin();
        await supabase.storage.from(BUCKET).remove(subidas);
      } catch {}
    }
    return { ok: false, mensaje };
  }
}

async function limpiarYResponder(supabase: Awaited<ReturnType<typeof exigirAdmin>>, subidas: string[], mensaje: string): Promise<Resultado> {
  if (subidas.length) await supabase.storage.from(BUCKET).remove(subidas);
  return { ok: false, mensaje };
}

export async function alternarAnuncio(id: number, activo: boolean): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("anuncios").update({ activo }).eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    revalidatePath("/admin/anuncios");
    refrescarCache();
    return { ok: true, mensaje: activo ? "Anuncio activado." : "Anuncio pausado." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error." };
  }
}

export async function eliminarAnuncio(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data } = await supabase.from("anuncios").select("rutas_imagenes").eq("id", id).maybeSingle<{ rutas_imagenes: string[] }>();
    const { error } = await supabase.from("anuncios").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    const rutas = (data?.rutas_imagenes ?? []).filter(Boolean);
    if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas);
    revalidatePath("/admin/anuncios");
    refrescarCache();
    return { ok: true, mensaje: "Anuncio eliminado." };
  } catch (e) {
    return { ok: false, mensaje: e instanceof Error ? e.message : "Error." };
  }
}
