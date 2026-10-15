"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { refrescarCache } from "@/lib/cache";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerAdminPanel } from "@/lib/supabase/server";
import { normalizarCelular } from "@/lib/telefono";
import { hoy, sumarMeses } from "@/lib/negocio";
import { aWebp, archivoDe, revisarImagen } from "@/lib/imagenServidor";
import { claveNombre } from "@/lib/panel/ubicaciones";
import type { Resultado } from "./acciones";

const BUCKET = "imagenes";
const MODO_DEMO: Resultado = { ok: false, mensaje: "Modo demostración: conecta Supabase para guardar cambios." };
const FALTA_SQL = "Falta ejecutar actualizacion-2.5.sql en Supabase (proyecto tu-negocio-en-linea).";

async function exigirAdmin() {
  const { supabase, esAdmin } = await obtenerAdminPanel();
  if (!esAdmin) throw new Error("No autorizado");
  return supabase;
}
type Supabase = Awaited<ReturnType<typeof exigirAdmin>>;

const texto = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);
const fecha = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const numero = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[,\sL]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const err = (e: unknown): Resultado => ({ ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." });
const sinTabla = (m: string) => /does not exist|schema cache|42P01|PGRST205/i.test(m);

function listo() {
  revalidatePath("/admin", "layout");
  refrescarCache();
}

// Municipios -------------------------------------------------------------------

export type ResultadoMunicipio = { ok: boolean; mensaje: string; municipio?: { id: number; departamento_id: number; nombre: string } };

/** "+ Nuevo municipio": si ya existe (sin importar tildes ni mayúsculas) devuelve el que ya estaba. */
export async function crearMunicipio(departamentoId: number, nombre: string): Promise<ResultadoMunicipio> {
  if (!supabaseConfigurado) return { ok: false, mensaje: MODO_DEMO!.mensaje };
  try {
    const supabase = await exigirAdmin();
    const limpio = nombre.replace(/\s+/g, " ").trim().slice(0, 60);
    if (!limpio) return { ok: false, mensaje: "Escribe el nombre del municipio." };
    if (!Number.isInteger(departamentoId) || departamentoId <= 0) return { ok: false, mensaje: "Elige primero el departamento." };
    const { data: existentes, error: e1 } = await supabase.from("municipios").select("id, departamento_id, nombre").eq("departamento_id", departamentoId);
    if (e1) return { ok: false, mensaje: sinTabla(e1.message) ? FALTA_SQL : e1.message };
    const igual = existentes?.find((m) => claveNombre(m.nombre) === claveNombre(limpio));
    if (igual) return { ok: true, mensaje: `“${igual.nombre}” ya existía; quedó elegido.`, municipio: { ...igual, id: Number(igual.id), departamento_id: Number(igual.departamento_id) } };
    const { data, error } = await supabase.from("municipios").insert({ departamento_id: departamentoId, nombre: limpio }).select("id, departamento_id, nombre").single();
    if (error) return { ok: false, mensaje: error.code === "23505" ? "Ese municipio ya existe." : "No se pudo agregar: " + error.message };
    listo();
    return { ok: true, mensaje: `Municipio “${limpio}” agregado.`, municipio: { ...data, id: Number(data.id), departamento_id: Number(data.departamento_id) } };
  } catch (e) {
    return { ok: false, mensaje: err(e)!.mensaje };
  }
}

export async function renombrarMunicipio(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id"));
    const nombre = texto(f, "nombre", 60).replace(/\s+/g, " ");
    if (!nombre) return { ok: false, mensaje: "Escribe el nombre." };
    const { error } = await supabase.from("municipios").update({ nombre }).eq("id", id);
    if (error) return { ok: false, mensaje: error.code === "23505" ? "Ya hay un municipio con ese nombre en ese departamento." : error.message };
    listo();
    return { ok: true, mensaje: "Nombre guardado." };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarMunicipio(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const [t, c, m, x] = await Promise.all([
      supabase.from("tiendas").select("id", { count: "exact", head: true }).eq("municipio_id", id),
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("municipio_id", id),
      supabase.from("mototaxistas").select("id", { count: "exact", head: true }).eq("municipio_id", id),
      supabase.from("mototaxistas").select("id", { count: "exact", head: true }).contains("municipios_extra", [id]),
    ]);
    const usos = (t.count ?? 0) + (c.count ?? 0) + (m.count ?? 0) + (x.count ?? 0);
    if (usos) return { ok: false, mensaje: "Hay tiendas o mototaxistas en este municipio. Cámbialos primero." };
    const { error } = await supabase.from("municipios").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    listo();
    return { ok: true, mensaje: "Municipio eliminado." };
  } catch (e) {
    return err(e);
  }
}

// Mototaxistas -------------------------------------------------------------------

async function subirFoto(supabase: Supabase, archivo: File, subidas: string[]) {
  const webp = await aWebp(archivo, 900);
  const ruta = `mototaxis/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(ruta, webp, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error("No se pudo subir la foto: " + error.message);
  subidas.push(ruta);
  return { url: supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl, ruta };
}

export async function guardarMototaxista(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  const subidas: string[] = [];
  let nuevoId: number | null = null;
  let supabase: Supabase | null = null;
  try {
    supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;
    const nombre = texto(f, "nombre", 80);
    if (!nombre) return { ok: false, mensaje: "Escribe el nombre del mototaxista." };
    const cel = normalizarCelular(texto(f, "codigo_pais", 4) || "504", texto(f, "celular", 30));
    if (!cel.ok) return { ok: false, mensaje: cel.error };
    if (!cel.nacional) return { ok: false, mensaje: "Escribe el celular del mototaxista: ahí le llegan los pedidos." };
    const municipio_id = Number(f.get("municipio_id")) || null;
    if (!municipio_id) return { ok: false, mensaje: "Elige el municipio donde trabaja." };
    const extra = [...new Set(f.getAll("municipios_extra").map(Number).filter((n) => Number.isInteger(n) && n > 0 && n !== municipio_id))];
    const cuota = numero(f, "cuota_personalizada");
    if (cuota !== null && (Number.isNaN(cuota) || cuota < 0)) return { ok: false, mensaje: "La mensualidad especial no es válida." };

    const foto = archivoDe(f, "foto");
    const fotoMoto = archivoDe(f, "foto_moto");
    const errImg = revisarImagen(foto, "La foto del mototaxista") ?? revisarImagen(fotoMoto, "La foto de la mototaxi");
    if (errImg) return { ok: false, mensaje: errImg };

    const anterior = id
      ? (await supabase.from("mototaxistas").select("foto_path, foto_moto_path, acepto_publicar, acepto_fecha").eq("id", id).maybeSingle()).data
      : null;
    if (id && !anterior) return { ok: false, mensaje: "No se encontró el mototaxista." };

    const acepto = f.get("acepto_publicar") === "on";
    const datos: Record<string, unknown> = {
      nombre,
      codigo_pais: cel.codigo,
      celular: cel.nacional,
      identidad: texto(f, "identidad", 30),
      direccion: texto(f, "direccion", 200),
      numero_mototaxi: texto(f, "numero_mototaxi", 20),
      municipio_id,
      municipios_extra: extra,
      acepto_publicar: acepto,
      // La fecha en que aceptó se guarda la primera vez que se marca
      acepto_fecha: acepto ? (anterior?.acepto_publicar && anterior.acepto_fecha) || hoy() : null,
      cuota_personalizada: cuota,
      activo: id ? f.get("activo") === "on" : true,
      notas: texto(f, "notas", 1000),
    };
    if (!id) datos.pagado_hasta = fecha(f, "pagado_hasta");

    const quitar: string[] = [];
    if (foto) {
      const s = await subirFoto(supabase, foto, subidas);
      Object.assign(datos, { foto_url: s.url, foto_path: s.ruta });
      if (anterior?.foto_path) quitar.push(anterior.foto_path);
    } else if (f.get("quitar_foto") === "on") {
      Object.assign(datos, { foto_url: null, foto_path: null });
      if (anterior?.foto_path) quitar.push(anterior.foto_path);
    }
    if (fotoMoto) {
      const s = await subirFoto(supabase, fotoMoto, subidas);
      Object.assign(datos, { foto_moto_url: s.url, foto_moto_path: s.ruta });
      if (anterior?.foto_moto_path) quitar.push(anterior.foto_moto_path);
    } else if (f.get("quitar_foto_moto") === "on") {
      Object.assign(datos, { foto_moto_url: null, foto_moto_path: null });
      if (anterior?.foto_moto_path) quitar.push(anterior.foto_moto_path);
    }

    if (id) {
      const { error } = await supabase.from("mototaxistas").update(datos).eq("id", id);
      if (error) throw new Error(sinTabla(error.message) ? FALTA_SQL : "No se pudo guardar: " + error.message);
    } else {
      const { data, error } = await supabase.from("mototaxistas").insert(datos).select("id").single();
      if (error) throw new Error(sinTabla(error.message) ? FALTA_SQL : "No se pudo guardar: " + error.message);
      nuevoId = Number(data.id);
    }
    if (quitar.length) await supabase.storage.from(BUCKET).remove(quitar);
    listo();
    if (id) return { ok: true, mensaje: "Datos guardados." };
  } catch (e) {
    if (subidas.length && supabase) await supabase.storage.from(BUCKET).remove(subidas).catch(() => {});
    return err(e);
  }
  redirect(`/admin/mototaxistas/${nuevoId}?nuevo=1`);
}

export async function eliminarMototaxista(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data } = await supabase.from("mototaxistas").select("foto_path, foto_moto_path").eq("id", id).maybeSingle();
    const { error } = await supabase.from("mototaxistas").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    const rutas = [data?.foto_path, data?.foto_moto_path].filter(Boolean) as string[];
    if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas);
  } catch (e) {
    return err(e);
  }
  listo();
  redirect("/admin/mototaxistas");
}

/** Enlace nuevo para su página personal (el anterior deja de funcionar). */
export async function nuevoEnlaceMototaxista(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("mototaxistas").update({ token: crypto.randomUUID() }).eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    listo();
    return { ok: true, mensaje: "Enlace nuevo creado. El anterior ya no funciona." };
  } catch (e) {
    return err(e);
  }
}

// Pagos de los mototaxistas -----------------------------------------------------------

export async function registrarPagoMototaxi(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("mototaxista_id"));
    const monto = numero(f, "monto");
    if (monto === null || Number.isNaN(monto) || monto <= 0) return { ok: false, mensaje: "Escribe el monto recibido." };
    const meses = Math.min(24, Math.max(1, Math.trunc(Number(f.get("meses")) || 1)));
    const fechaPago = fecha(f, "fecha") ?? hoy();
    const { data: m } = await supabase.from("mototaxistas").select("pagado_hasta").eq("id", id).maybeSingle();
    if (!m) return { ok: false, mensaje: "No se encontró el mototaxista." };
    // Si estaba al día, se suma desde su fecha; si estaba vencido, desde el día que paga
    const base = m.pagado_hasta && m.pagado_hasta >= fechaPago ? m.pagado_hasta : fechaPago;
    const pagadoHasta = sumarMeses(base, meses);
    const { error } = await supabase.from("pagos_mototaxi").insert({
      mototaxista_id: id,
      fecha: fechaPago,
      monto,
      meses,
      metodo: texto(f, "metodo", 40),
      nota: texto(f, "nota", 300),
      pagado_hasta: pagadoHasta,
      pagado_antes: m.pagado_hasta,
    });
    if (error) return { ok: false, mensaje: "No se pudo registrar: " + error.message };
    await supabase.from("mototaxistas").update({ pagado_hasta: pagadoHasta }).eq("id", id);
    listo();
    return { ok: true, mensaje: `Pago registrado. Queda pagado hasta el ${pagadoHasta.split("-").reverse().join("/")} y vuelve a estar visible en las tiendas.` };
  } catch (e) {
    return err(e);
  }
}

/** Borra un pago. Si era el último, la fecha "pagado hasta" regresa a la de antes. */
export async function eliminarPagoMototaxi(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data: p } = await supabase.from("pagos_mototaxi").select("mototaxista_id, pagado_hasta, pagado_antes").eq("id", id).maybeSingle();
    if (!p) return { ok: false, mensaje: "El pago ya no existe." };
    const { data: m } = await supabase.from("mototaxistas").select("pagado_hasta").eq("id", p.mototaxista_id).maybeSingle();
    const { error } = await supabase.from("pagos_mototaxi").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    if (m?.pagado_hasta === p.pagado_hasta) {
      await supabase.from("mototaxistas").update({ pagado_hasta: p.pagado_antes }).eq("id", p.mototaxista_id);
    }
    listo();
    return { ok: true, mensaje: "Pago eliminado." };
  } catch (e) {
    return err(e);
  }
}
