"use server";

import { revalidatePath } from "next/cache";
import { refrescarCache } from "@/lib/cache";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerAdminPanel } from "@/lib/supabase/server";
import { LADO_ANUNCIO } from "@/lib/anunciosConfig";
import { aWebp, archivoDe, revisarImagen } from "@/lib/imagenServidor";
import type { Resultado } from "./acciones";

const BUCKET = "imagenes";
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
const err = (e: unknown): Resultado => ({ ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." });

function listo() {
  revalidatePath("/admin/publicidad");
  refrescarCache();
}

export async function guardarPublicidad(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  let subida = "";
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;
    const titulo = texto(f, "titulo", 80);
    if (!titulo) return { ok: false, mensaje: "Escribe el título de la publicidad." };

    // Anunciante: una tienda de tus clientes o un negocio de afuera
    const datos: Record<string, unknown> = {};
    if (String(f.get("anunciante")) === "tienda") {
      const tiendaId = Number(f.get("anunciante_tienda_id"));
      if (!tiendaId) return { ok: false, mensaje: "Elige la tienda que se anuncia." };
      const { data: t } = await supabase.from("tiendas").select("nombre_tienda, tipo_negocio_id, tipo_negocio_otro").eq("id", tiendaId).maybeSingle();
      if (!t) return { ok: false, mensaje: "No se encontró esa tienda." };
      // Su tipo de negocio: así nunca sale en tiendas del mismo tipo
      Object.assign(datos, {
        anunciante_tienda_id: tiendaId,
        anunciante_nombre: t.nombre_tienda.slice(0, 80),
        tipo_negocio_id: t.tipo_negocio_id,
        tipo_negocio_otro: t.tipo_negocio_otro ?? "",
      });
    } else {
      const nombre = texto(f, "anunciante_nombre", 80);
      if (!nombre) return { ok: false, mensaje: "Escribe el nombre del negocio que se anuncia." };
      Object.assign(datos, {
        anunciante_tienda_id: null,
        anunciante_nombre: nombre,
        tipo_negocio_id: Number(f.get("tipo_negocio_id")) || null,
        tipo_negocio_otro: texto(f, "tipo_negocio_otro", 60),
      });
    }

    const enlace = texto(f, "enlace_url", 300);
    if (enlace && !/^https:\/\/[^\s]+$/i.test(enlace)) return { ok: false, mensaje: "El enlace debe empezar con https://" };
    if (!enlace && !datos.anunciante_tienda_id) return { ok: false, mensaje: "Pega el enlace a donde lleva la publicidad (su página, Facebook o WhatsApp)." };
    const inicia = fecha(f, "inicia");
    const termina = fecha(f, "termina");
    if (inicia && termina && termina < inicia) return { ok: false, mensaje: "La fecha de fin no puede ser antes de la de inicio." };
    const precioTexto = texto(f, "precio", 20).replace(/[,\sL]/gi, "");
    const precio = precioTexto ? Number(precioTexto) : null;
    if (precio !== null && (!Number.isFinite(precio) || precio < 0)) return { ok: false, mensaje: "El precio cobrado no es válido." };

    const imagen = archivoDe(f, "imagen");
    const errImg = revisarImagen(imagen);
    if (errImg) return { ok: false, mensaje: errImg };
    const anterior = id ? (await supabase.from("publicidad").select("imagen_path").eq("id", id).maybeSingle()).data : null;
    if (id && !anterior) return { ok: false, mensaje: "No se encontró la publicidad." };
    if (!id && !imagen) return { ok: false, mensaje: "Sube la imagen de la publicidad." };
    if (imagen) {
      const webp = await aWebp(imagen, LADO_ANUNCIO);
      subida = `anuncios/publicidad-${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(subida, webp, { contentType: "image/webp", cacheControl: "31536000" });
      if (error) {
        subida = "";
        throw new Error("No se pudo subir la imagen: " + error.message);
      }
      datos.imagen_url = supabase.storage.from(BUCKET).getPublicUrl(subida).data.publicUrl;
      datos.imagen_path = subida;
    }

    Object.assign(datos, {
      titulo,
      texto: texto(f, "texto", 300),
      enlace_url: enlace,
      boton_texto: texto(f, "boton_texto", 30) || (datos.anunciante_tienda_id ? "Ver tienda" : "Ver más"),
      municipio_id: Number(f.get("municipio_id")) || null,
      precio,
      activo: f.get("activo") === "on",
      inicia,
      termina,
    });
    const { error } = id ? await supabase.from("publicidad").update(datos).eq("id", id) : await supabase.from("publicidad").insert(datos);
    if (error) {
      const falta = /does not exist|schema cache/i.test(error.message);
      throw new Error(falta ? "Falta ejecutar actualizacion-2.5.sql en Supabase." : "No se pudo guardar: " + error.message);
    }
    if (imagen && anterior?.imagen_path) await supabase.storage.from(BUCKET).remove([anterior.imagen_path]);
    listo();
    return { ok: true, mensaje: id ? "Publicidad guardada." : "Publicidad creada." };
  } catch (e) {
    if (subida) {
      try {
        await (await exigirAdmin()).storage.from(BUCKET).remove([subida]);
      } catch {}
    }
    return err(e);
  }
}

export async function alternarPublicidad(id: number, activo: boolean): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("publicidad").update({ activo }).eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    listo();
    return { ok: true, mensaje: activo ? "Publicidad activada." : "Publicidad pausada." };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarPublicidad(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data } = await supabase.from("publicidad").select("imagen_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("publicidad").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    if (data?.imagen_path) await supabase.storage.from(BUCKET).remove([data.imagen_path]);
    listo();
    return { ok: true, mensaje: "Publicidad eliminada." };
  } catch (e) {
    return err(e);
  }
}
