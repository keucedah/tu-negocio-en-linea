// Mototaxistas en tu panel (2.5): lectura, estado de su mensualidad, mensajes y recibos.
import { supabaseConfigurado } from "../config";
import { crearClienteServidor } from "../supabase/server";
import { diasHasta, fechaCorta, hoy, lempiras } from "../negocio";
import { formatearCelular, numeroWhatsApp } from "../telefono";
import type { DatosRecibo } from "./recibo";
import type { Ajustes, Mototaxista, PagoMototaxi } from "./types";

const COLUMNAS =
  "id, codigo, nombre, codigo_pais, celular, identidad, direccion, numero_mototaxi, foto_url, foto_path, foto_moto_url, foto_moto_path, " +
  "municipio_id, municipios_extra, acepto_publicar, acepto_fecha, cuota_personalizada, pagado_hasta, activo, notas, token, veces_elegido, creado_en";

const aMototaxista = (m: Mototaxista): Mototaxista => ({
  ...m,
  id: Number(m.id),
  municipio_id: m.municipio_id == null ? null : Number(m.municipio_id),
  municipios_extra: (m.municipios_extra ?? []).map(Number),
  cuota_personalizada: m.cuota_personalizada == null ? null : Number(m.cuota_personalizada),
});

/** null = falta ejecutar el SQL de la 2.5. */
export async function obtenerMototaxistas(): Promise<Mototaxista[] | null> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("mototaxistas").select(COLUMNAS).order("id");
  if (error) return null;
  return (data as unknown as Mototaxista[]).map(aMototaxista);
}

export async function obtenerMototaxista(id: number): Promise<Mototaxista | null> {
  if (!supabaseConfigurado || !Number.isInteger(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("mototaxistas").select(COLUMNAS).eq("id", id).maybeSingle();
  return data ? aMototaxista(data as unknown as Mototaxista) : null;
}

export async function obtenerPagosMototaxi(mototaxistaId: number): Promise<PagoMototaxi[]> {
  if (!supabaseConfigurado) return [];
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("pagos_mototaxi")
    .select("id, mototaxista_id, fecha, monto, meses, metodo, nota, pagado_hasta, numero_recibo")
    .eq("mototaxista_id", mototaxistaId)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });
  return (data ?? []).map((p) => ({ ...p, monto: Number(p.monto), numero_recibo: Number(p.numero_recibo) }));
}

export function cuotaMototaxi(m: Pick<Mototaxista, "cuota_personalizada">, a: Ajustes): number {
  return m.cuota_personalizada ?? a.cuota_mototaxi;
}

export type EstadoMototaxi = "al_dia" | "por_vencer" | "vencido" | "sin_pagos" | "baja";

/** Al día, por vencer o vencido. Vencido o sin pagos = suspendido en las tiendas. */
export function estadoMototaxi(m: Pick<Mototaxista, "activo" | "pagado_hasta">, diasAviso: number, h = hoy()) {
  if (!m.activo) return { estado: "baja" as EstadoMototaxi, dias: 0, suspendido: true, texto: "Dado de baja" };
  if (!m.pagado_hasta) return { estado: "sin_pagos" as EstadoMototaxi, dias: 0, suspendido: true, texto: "Sin pagos · Suspendido" };
  const dias = diasHasta(m.pagado_hasta, h);
  if (dias < 0)
    return { estado: "vencido" as EstadoMototaxi, dias, suspendido: true, texto: `Vencido hace ${-dias} día${dias === -1 ? "" : "s"} · Suspendido` };
  if (dias <= diasAviso)
    return { estado: "por_vencer" as EstadoMototaxi, dias, suspendido: false, texto: dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días` };
  return { estado: "al_dia" as EstadoMototaxi, dias, suspendido: false, texto: "Al día" };
}

export const CLASE_ESTADO_MOTO: Record<EstadoMototaxi, string> = {
  al_dia: "bg-green-100 text-green-800",
  por_vencer: "bg-yellow-100 text-yellow-900",
  vencido: "bg-red-100 text-red-800",
  sin_pagos: "bg-red-100 text-red-800",
  baja: "bg-gray-200 text-gray-600",
};

/** Mensaje de cobro por WhatsApp según cómo esté su mensualidad. */
export function mensajeCobroMototaxi(m: Mototaxista, a: Ajustes, enlace: string): string {
  const e = estadoMototaxi(m, a.dias_aviso);
  const monto = lempiras(cuotaMototaxi(m, a));
  const saludo = `Hola ${m.nombre}, le saluda ${a.nombre_negocio}.`;
  const pie = `\nAl pagar, envíenos el comprobante por aquí. ¡Gracias!\n\nSu página: ${enlace}`;
  if (e.estado === "sin_pagos")
    return `${saludo}\nYa está registrado como mototaxista (${m.codigo}). Para aparecer en las tiendas, realice su primer pago mensual de *${monto}*.${pie}`;
  if (e.estado === "vencido")
    return `${saludo}\nSu mensualidad de mototaxista (${m.codigo}) por *${monto}* venció el *${fechaCorta(m.pagado_hasta)}* y por eso aparece como *Suspendido* en las tiendas.\nRealice su pago para volver a estar visible.${pie}`;
  return `${saludo}\nLe recordamos que su mensualidad de mototaxista (${m.codigo}) por *${monto}* vence el *${fechaCorta(m.pagado_hasta)}*.\nRealice su pago para seguir visible en las tiendas.${pie}`;
}

/** "MT001-0001" */
export const numeroReciboMototaxi = (m: Pick<Mototaxista, "codigo">, p: Pick<PagoMototaxi, "numero_recibo">) =>
  `${m.codigo.replace(/-/g, "")}-${String(p.numero_recibo).padStart(4, "0")}`;

export function datosReciboMototaxi(p: PagoMototaxi, m: Mototaxista, a: Ajustes, municipio: string): DatosRecibo {
  const numero = numeroReciboMototaxi(m, p);
  return {
    numero,
    fecha: fechaCorta(p.fecha),
    emisor: {
      nombre: a.nombre_negocio,
      eslogan: a.eslogan,
      direccion: a.direccion,
      celular: formatearCelular(a.codigo_pais, a.celular),
      correo: a.correo,
    },
    cliente: {
      negocio: `${m.nombre} (${m.codigo})`,
      contacto: m.numero_mototaxi ? `Mototaxi N.º ${m.numero_mototaxi}` : "",
      celular: formatearCelular(m.codigo_pais, m.celular),
      direccion: [m.direccion, municipio].filter(Boolean).join(", "),
      correo: "",
      whatsapp: numeroWhatsApp(m.codigo_pais, m.celular),
    },
    concepto: `Mensualidad de mototaxista (${p.meses === 1 ? "1 mes" : `${p.meses} meses`})`,
    plan: "Mototaxista",
    monto: p.monto,
    metodo: p.metodo,
    nota: p.nota,
    pagadoHasta: fechaCorta(p.pagado_hasta),
    archivo: `Recibo-${numero}.pdf`,
  };
}
