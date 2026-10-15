"use server";

import { revalidatePath } from "next/cache";
import { refrescarCache } from "@/lib/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { obtenerAdminPanel } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/config";
import { normalizarCelular } from "@/lib/telefono";
import { hoy, sumarMeses } from "@/lib/negocio";
import { cambiarClaveDuenos, crearTienda, faltaColumna, sincronizarTienda, suspenderTienda } from "@/lib/panel/tiendas";
import type { Cliente, Plan } from "@/lib/panel/types";

export type Resultado = { ok: boolean; mensaje: string } | null;

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
/** Número opcional: vacío = null. Acepta "1,500.50". */
const numero = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[,\sL]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
/** Cliente y su plan, para copiar a su tienda el límite, el dominio y el estado. */
async function clienteYPlan(supabase: Awaited<ReturnType<typeof exigirAdmin>>, id: number) {
  const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle<Cliente>();
  if (!cliente) return { cliente: null, plan: undefined };
  const { data: plan } = cliente.plan_id
    ? await supabase.from("planes").select("*").eq("id", cliente.plan_id).maybeSingle<Plan>()
    : { data: null };
  return { cliente, plan: plan ?? undefined };
}

async function sincronizar(supabase: Awaited<ReturnType<typeof exigirAdmin>>, id: number) {
  const { cliente, plan } = await clienteYPlan(supabase, id);
  return cliente ? sincronizarTienda(cliente, plan) : null;
}

/** Guarda por 15 minutos el acceso recién creado, para mostrarlo una vez en la ficha y enviarlo por WhatsApp. */
async function recordarAcceso(clienteId: number, correo: string, clave: string) {
  (await cookies()).set("acceso_nuevo", JSON.stringify({ clienteId, correo, clave }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 15 * 60,
  });
}

const err = (e: unknown): Resultado => ({ ok: false, mensaje: e instanceof Error ? e.message : "Error inesperado." });

// Clientes ------------------------------------------------------------------

export async function guardarCliente(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  let nuevoId: number | null = null;
  let errorTienda = "";
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;
    const negocio = texto(f, "negocio", 120);
    if (!negocio) return { ok: false, mensaje: "Escribe el nombre del negocio." };

    const cel = normalizarCelular(texto(f, "codigo_pais", 4) || "504", texto(f, "celular", 30));
    if (!cel.ok) return { ok: false, mensaje: cel.error };

    const limite = numero(f, "limite_personalizado");
    const cuota = numero(f, "cuota_personalizada");
    if (limite !== null && (!Number.isInteger(limite) || limite <= 0)) return { ok: false, mensaje: "El límite de productos debe ser un número entero mayor que 0." };
    if (cuota !== null && (Number.isNaN(cuota) || cuota < 0)) return { ok: false, mensaje: "La cuota mensual no es válida." };

    const estado = texto(f, "estado", 20);
    const datos: Record<string, unknown> = {
      negocio,
      contacto: texto(f, "contacto", 120),
      codigo_pais: cel.codigo,
      celular: cel.nacional,
      correo: texto(f, "correo", 120),
      direccion: texto(f, "direccion", 200),
      sitio_url: texto(f, "sitio_url", 200),
      dominio: texto(f, "dominio", 120),
      plan_id: Number(f.get("plan_id")) || null,
      con_dominio: f.get("con_dominio") === "on",
      limite_personalizado: limite,
      cuota_personalizada: cuota,
      estado: ["prueba", "activo", "suspendido", "cancelado"].includes(estado) ? estado : "activo",
      fecha_inicio: fecha(f, "fecha_inicio") ?? hoy(),
      proximo_pago: fecha(f, "proximo_pago"),
      instalacion_pagada: f.get("instalacion_pagada") === "on",
      notas: texto(f, "notas", 2000),
      tipo_negocio_id: Number(f.get("tipo_negocio_id")) || null,
      tipo_negocio_otro: texto(f, "tipo_negocio_otro", 60),
      actualizado_en: new Date().toISOString(),
    };
    // Municipio de su tienda (2.5): solo si el formulario lo trae
    if (f.has("municipio_id")) datos.municipio_id = Number(f.get("municipio_id")) || null;
    // "Servicio de mototaxi" (2.5.1): solo el administrador lo cambia
    if (f.has("campo_mototaxi")) datos.ofrece_mototaxi = f.get("ofrece_mototaxi") === "on";
    const quitarMunicipio = () => {
      delete datos.municipio_id;
      delete datos.ofrece_mototaxi;
    };

    if (id) {
      let { error } = await supabase.from("clientes").update(datos).eq("id", id);
      if (faltaColumna(error)) {
        quitarMunicipio();
        ({ error } = await supabase.from("clientes").update(datos).eq("id", id));
      }
      if (error) return { ok: false, mensaje: "No se pudo guardar: " + error.message };
      const errSync = await sincronizar(supabase, id);
      revalidatePath("/admin", "layout");
      refrescarCache();
      if (errSync) return { ok: false, mensaje: "Datos guardados. " + errSync };
      return { ok: true, mensaje: "Cambios guardados." };
    }
    let { data, error } = await supabase.from("clientes").insert(datos).select("id").single();
    if (faltaColumna(error)) {
      quitarMunicipio();
      ({ data, error } = await supabase.from("clientes").insert(datos).select("id").single());
    }
    if (error || !data) return { ok: false, mensaje: "No se pudo guardar: " + (error?.message ?? "") };
    nuevoId = data.id;

    // Tienda en línea del cliente nuevo (opcional)
    const slug = texto(f, "slug", 40).toLowerCase();
    if (slug) {
      const correo = texto(f, "correo_dueno", 120) || String(datos.correo);
      const clave = String(f.get("clave") ?? "");
      const { cliente, plan } = await clienteYPlan(supabase, data.id);
      const r = cliente ? await crearTienda(cliente, plan, slug, correo, clave) : { ok: false as const, mensaje: "" };
      if (r.ok) await recordarAcceso(data.id, correo.toLowerCase(), r.usuarioNuevo ? clave : "");
      else errorTienda = r.mensaje;
    }
  } catch (e) {
    return err(e);
  }
  revalidatePath("/admin", "layout");
  refrescarCache();
  redirect(`/admin/clientes/${nuevoId}?nuevo=1${errorTienda ? "&error_tienda=" + encodeURIComponent(errorTienda) : ""}`);
}

/** Crea la tienda de un cliente que todavía no tiene. */
export async function crearTiendaCliente(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id"));
    const { cliente, plan } = await clienteYPlan(supabase, id);
    if (!cliente) return { ok: false, mensaje: "No se encontró el cliente." };
    const correo = texto(f, "correo_dueno", 120);
    const clave = String(f.get("clave") ?? "");
    const r = await crearTienda(cliente, plan, texto(f, "slug", 40).toLowerCase(), correo, clave);
    if (!r.ok) return { ok: false, mensaje: r.mensaje };
    await recordarAcceso(id, correo.toLowerCase(), r.usuarioNuevo ? clave : "");
    revalidatePath("/admin", "layout");
    refrescarCache();
    return {
      ok: true,
      mensaje: r.usuarioNuevo ? "Tienda creada." : "Tienda creada. Ese correo ya tenía usuario: entra con su contraseña de siempre.",
    };
  } catch (e) {
    return err(e);
  }
}

/** Nueva contraseña para el dueño de la tienda (por si la olvidó). */
export async function cambiarClaveTienda(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id"));
    const { cliente } = await clienteYPlan(supabase, id);
    if (!cliente?.tienda_id) return { ok: false, mensaje: "Este cliente no tiene tienda." };
    const clave = String(f.get("clave") ?? "");
    const e = await cambiarClaveDuenos(cliente.tienda_id, clave);
    if (e) return { ok: false, mensaje: e };
    await recordarAcceso(id, String(f.get("correo") ?? ""), clave);
    revalidatePath("/admin", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Contraseña cambiada." };
  } catch (e) {
    return err(e);
  }
}

/** Cambio rápido de plan desde la ficha del cliente. */
export async function cambiarPlan(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id"));
    const plan_id = Number(f.get("plan_id")) || null;
    const { error } = await supabase.from("clientes").update({ plan_id, actualizado_en: new Date().toISOString() }).eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    const errSync = await sincronizar(supabase, id);
    revalidatePath("/admin", "layout");
    refrescarCache();
    if (errSync) return { ok: false, mensaje: "Plan guardado. " + errSync };
    return { ok: true, mensaje: "Plan actualizado. Su tienda ya tiene el nuevo límite." };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarCliente(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data: c } = await supabase.from("clientes").select("tienda_id").eq("id", id).maybeSingle();
    await suspenderTienda(c?.tienda_id ?? null);
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
  } catch (e) {
    return err(e);
  }
  revalidatePath("/admin", "layout");
  refrescarCache();
  redirect("/admin");
}

// Pagos ---------------------------------------------------------------------

export async function registrarPago(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const cliente_id = Number(f.get("cliente_id"));
    const monto = numero(f, "monto");
    if (monto === null || Number.isNaN(monto) || monto <= 0) return { ok: false, mensaje: "Escribe el monto recibido." };
    const concepto = texto(f, "concepto", 20);
    if (!["mensualidad", "instalacion", "dominio", "otro"].includes(concepto)) return { ok: false, mensaje: "Elige el concepto del pago." };
    const meses = concepto === "mensualidad" ? Math.min(24, Math.max(1, Number(f.get("meses")) || 1)) : 0;
    const fechaPago = fecha(f, "fecha") ?? hoy();

    const { data: cliente } = await supabase
      .from("clientes")
      .select("proximo_pago, estado, planes(nombre)")
      .eq("id", cliente_id)
      .maybeSingle<{ proximo_pago: string | null; estado: string; planes: { nombre: string } | null }>();
    if (!cliente) return { ok: false, mensaje: "No se encontró el cliente." };
    const pagadoHasta = meses > 0 ? sumarMeses(cliente.proximo_pago ?? fechaPago, meses) : null;

    // El plan y el "pagado hasta" quedan guardados en el pago para el recibo
    const { error } = await supabase.from("pagos").insert({
      cliente_id,
      monto,
      concepto,
      meses,
      fecha: fechaPago,
      metodo: texto(f, "metodo", 40),
      nota: texto(f, "nota", 300),
      plan_nombre: (cliente.planes?.nombre ?? "").slice(0, 40),
      pagado_hasta: pagadoHasta,
    });
    if (error) return { ok: false, mensaje: "No se pudo registrar: " + error.message };

    // Efecto del pago en la ficha del cliente
    const cambios: Record<string, unknown> = {};
    if (pagadoHasta) {
      cambios.proximo_pago = pagadoHasta;
      if (cliente.estado === "suspendido") cambios.estado = "activo";
    }
    if (concepto === "instalacion") cambios.instalacion_pagada = true;
    if (Object.keys(cambios).length) {
      cambios.actualizado_en = new Date().toISOString();
      await supabase.from("clientes").update(cambios).eq("id", cliente_id);
      if (cambios.estado) await sincronizar(supabase, cliente_id);
    }

    revalidatePath("/admin", "layout");

    refrescarCache();
    return {
      ok: true,
      mensaje: meses > 0 ? `Pago registrado. Próximo pago movido ${meses === 1 ? "1 mes" : `${meses} meses`} adelante.` : "Pago registrado.",
    };
  } catch (e) {
    return err(e);
  }
}

/** Elimina un pago. Si era mensualidad, regresa la fecha de próximo pago los meses que había adelantado. */
export async function eliminarPago(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { data: pago } = await supabase.from("pagos").select("cliente_id, meses").eq("id", id).maybeSingle();
    if (!pago) return { ok: false, mensaje: "El pago ya no existe." };
    const { error } = await supabase.from("pagos").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    if (pago.meses > 0) {
      const { data: c } = await supabase.from("clientes").select("proximo_pago").eq("id", pago.cliente_id).maybeSingle();
      if (c?.proximo_pago) {
        await supabase.from("clientes").update({ proximo_pago: sumarMeses(c.proximo_pago, -pago.meses) }).eq("id", pago.cliente_id);
      }
    }
    revalidatePath("/admin", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Pago eliminado." };
  } catch (e) {
    return err(e);
  }
}

// Planes --------------------------------------------------------------------

export async function guardarPlan(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;
    const nombre = texto(f, "nombre", 40);
    const precio = numero(f, "precio_mensual");
    const limite = numero(f, "limite_productos");
    if (!nombre) return { ok: false, mensaje: "El plan necesita un nombre." };
    if (precio === null || Number.isNaN(precio) || precio < 0) return { ok: false, mensaje: "Escribe el precio mensual." };
    if (limite === null || !Number.isInteger(limite) || limite <= 0) return { ok: false, mensaje: "El límite de productos debe ser un número entero mayor que 0." };
    const color = texto(f, "color", 10);
    const datos = {
      nombre,
      subtitulo: texto(f, "subtitulo", 80),
      precio_mensual: precio,
      limite_productos: limite,
      caracteristicas: texto(f, "caracteristicas", 1000),
      color: ["azul", "naranja", "verde", "morado", "gris"].includes(color) ? color : "azul",
      orden: Math.trunc(Number(f.get("orden")) || 0),
      visible: f.get("visible") === "on",
      con_publicidad: f.get("con_publicidad") === "on",
    };
    const guardar = (d: Partial<typeof datos>) =>
      id ? supabase.from("planes").update(d).eq("id", id) : supabase.from("planes").insert(d);
    let { error } = await guardar(datos);
    if (faltaColumna(error)) {
      const { con_publicidad: _sinColumna, ...antes } = datos;
      void _sinColumna;
      ({ error } = await guardar(antes));
    }
    if (error) {
      if (error.code === "23505") return { ok: false, mensaje: "Ya existe un plan con ese nombre." };
      return { ok: false, mensaje: "No se pudo guardar: " + error.message };
    }
    if (id) {
      // El nuevo límite llega a las tiendas de los clientes con este plan
      const { data: conPlan } = await supabase.from("clientes").select("id").eq("plan_id", id).not("tienda_id", "is", null);
      for (const c of conPlan ?? []) await sincronizar(supabase, c.id);
    }
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: id ? `Plan “${nombre}” actualizado.` : `Plan “${nombre}” creado.` };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarPlan(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("planes").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") return { ok: false, mensaje: "Hay clientes con este plan. Cámbialos de plan primero, o desmarca “Mostrar en la página” para ocultarlo." };
      return { ok: false, mensaje: error.message };
    }
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Plan eliminado." };
  } catch (e) {
    return err(e);
  }
}

// Tipos de negocio -----------------------------------------------------------

const hex = (f: FormData, k: string, defecto: string) => {
  const v = String(f.get(k) ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(v) ? v : defecto;
};

export async function guardarTipo(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const id = Number(f.get("id")) || null;
    const nombre = texto(f, "nombre", 60);
    if (!nombre) return { ok: false, mensaje: "El tipo de negocio necesita un nombre." };
    const categorias = [...new Set(String(f.get("categorias") ?? "").split(/\r?\n/).map((c) => c.trim().slice(0, 60)).filter(Boolean))]
      .join("\n")
      .slice(0, 1000);
    const datos = {
      nombre,
      color_principal: hex(f, "color_principal", "#ea580c"),
      color_encabezado: hex(f, "color_encabezado", "#111827"),
      titulo_portada: texto(f, "titulo_portada", 80),
      texto_portada: texto(f, "texto_portada", 200),
      texto_buscador: texto(f, "texto_buscador", 60),
      categorias,
      orden: Math.max(-999, Math.min(999, Math.trunc(Number(f.get("orden")) || 0))),
      activo: f.get("activo") === "on",
    };
    const { error } = id
      ? await supabase.from("tipos_negocio").update(datos).eq("id", id)
      : await supabase.from("tipos_negocio").insert(datos);
    if (error) {
      if (error.code === "23505") return { ok: false, mensaje: "Ya existe un tipo de negocio con ese nombre." };
      return { ok: false, mensaje: "No se pudo guardar: " + error.message };
    }
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: id ? `“${nombre}” actualizado.` : `“${nombre}” creado.` };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarTipo(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { count } = await supabase.from("clientes").select("id", { count: "exact", head: true }).eq("tipo_negocio_id", id);
    if (count) return { ok: false, mensaje: `Hay ${count} cliente(s) con este tipo. Cámbialos primero, o desmárcalo como activo para ocultarlo.` };
    const { error } = await supabase.from("tipos_negocio").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Tipo de negocio eliminado." };
  } catch (e) {
    return err(e);
  }
}

// Ajustes -------------------------------------------------------------------

export async function guardarAjustes(_prev: Resultado, f: FormData): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const nombre = texto(f, "nombre_negocio", 60);
    if (!nombre) return { ok: false, mensaje: "Escribe el nombre de tu negocio." };
    const cel = normalizarCelular(texto(f, "codigo_pais", 4) || "504", texto(f, "celular", 30));
    if (!cel.ok) return { ok: false, mensaje: cel.error };
    const inst = numero(f, "precio_instalacion");
    const dom = numero(f, "precio_dominio");
    if (inst === null || Number.isNaN(inst) || inst < 0 || dom === null || Number.isNaN(dom) || dom < 0) {
      return { ok: false, mensaje: "Revisa los precios de instalación y dominio." };
    }
    const cuotaMoto = numero(f, "cuota_mototaxi");
    const cargaExtra = numero(f, "precio_carga_extra");
    if ((cuotaMoto !== null && (Number.isNaN(cuotaMoto) || cuotaMoto < 0)) || (cargaExtra !== null && (Number.isNaN(cargaExtra) || cargaExtra < 0))) {
      return { ok: false, mensaje: "Revisa la mensualidad de los mototaxistas y el precio de productos adicionales." };
    }
    const nuevos25: Record<string, number> = {};
    if (cuotaMoto !== null) nuevos25.cuota_mototaxi = cuotaMoto;
    if (cargaExtra !== null) nuevos25.precio_carga_extra = cargaExtra;
    const guardar = (extra: Record<string, number>) => supabase
      .from("ajustes_negocio")
      .update({
        ...extra,
        nombre_negocio: nombre,
        eslogan: texto(f, "eslogan", 80),
        codigo_pais: cel.codigo,
        celular: cel.nacional,
        correo: texto(f, "correo", 120),
        direccion: texto(f, "direccion", 200),
        precio_instalacion: inst,
        precio_dominio: dom,
        dias_aviso: Math.min(60, Math.max(0, Math.trunc(Number(f.get("dias_aviso")) || 0))),
        plantilla_cobro: texto(f, "plantilla_cobro", 1500),
        plantilla_vencido: texto(f, "plantilla_vencido", 1500),
        plantilla_recibo: texto(f, "plantilla_recibo", 1500),
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", 1);
    let { error } = await guardar(nuevos25);
    if (faltaColumna(error)) ({ error } = await guardar({}));
    if (error) return { ok: false, mensaje: "No se pudo guardar: " + error.message };
    revalidatePath("/", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Ajustes guardados." };
  } catch (e) {
    return err(e);
  }
}

// Solicitudes de demostración -------------------------------------------------

export async function marcarSolicitud(id: number, atendida: boolean): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("solicitudes_demo").update({ atendida }).eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    revalidatePath("/admin", "layout");
    refrescarCache();
    return { ok: true, mensaje: atendida ? "Marcada como atendida." : "Marcada como pendiente." };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarSolicitud(id: number): Promise<Resultado> {
  if (!supabaseConfigurado) return MODO_DEMO;
  try {
    const supabase = await exigirAdmin();
    const { error } = await supabase.from("solicitudes_demo").delete().eq("id", id);
    if (error) return { ok: false, mensaje: error.message };
    revalidatePath("/admin", "layout");
    refrescarCache();
    return { ok: true, mensaje: "Solicitud eliminada." };
  } catch (e) {
    return err(e);
  }
}
