// Cálculos del negocio: cuotas, fechas de pago, estado de cobro y mensajes de WhatsApp.
import { formatearCelular, numeroWhatsApp } from "./telefono";
import type { Ajustes, Cliente, Plan } from "./panel/types";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fecha de hoy en Honduras (UTC-6), como AAAA-MM-DD. */
export function hoy(): string {
  return new Date(Date.now() - 6 * 3600 * 1000).toISOString().slice(0, 10);
}

/** "2026-10-09" → "9 oct 2026" */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

/** Suma meses a una fecha; si el día no existe (31 de febrero) usa el último día del mes. */
export function sumarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** Días desde hoy hasta la fecha (negativo = ya pasó). */
export function diasHasta(iso: string, desde = hoy()): number {
  const a = Date.parse(iso.slice(0, 10) + "T00:00:00Z");
  const b = Date.parse(desde + "T00:00:00Z");
  return Math.round((a - b) / 86400000);
}

export function lempiras(n: number): string {
  return "L " + n.toLocaleString("es-HN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function cuotaMensual(cliente: Cliente, plan: Plan | undefined, ajustes: Ajustes): number {
  if (cliente.cuota_personalizada != null) return Number(cliente.cuota_personalizada);
  return Number(plan?.precio_mensual ?? 0) + (cliente.con_dominio ? Number(ajustes.precio_dominio) : 0);
}

export function limiteProductos(cliente: Cliente, plan: Plan | undefined): number | null {
  return cliente.limite_personalizado ?? plan?.limite_productos ?? null;
}

export type EstadoCobro = "al_dia" | "por_vencer" | "vencido" | "sin_fecha" | "no_cobra";

export function estadoCobro(cliente: Cliente, diasAviso: number, hoyIso = hoy()): { estado: EstadoCobro; dias: number } {
  if (cliente.estado === "cancelado") return { estado: "no_cobra", dias: 0 };
  if (!cliente.proximo_pago) return { estado: "sin_fecha", dias: 0 };
  const dias = diasHasta(cliente.proximo_pago, hoyIso);
  if (dias < 0) return { estado: "vencido", dias };
  if (dias <= diasAviso) return { estado: "por_vencer", dias };
  return { estado: "al_dia", dias };
}

export function textoCobro({ estado, dias }: { estado: EstadoCobro; dias: number }): string {
  switch (estado) {
    case "vencido":
      return dias === -1 ? "Vencido hace 1 día" : `Vencido hace ${-dias} días`;
    case "por_vencer":
      return dias === 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`;
    case "al_dia":
      return "Al día";
    case "sin_fecha":
      return "Sin fecha de pago";
    default:
      return "No se cobra";
  }
}

/** Reemplaza {campos} de una plantilla de mensaje. */
export function llenarPlantilla(plantilla: string, datos: Record<string, string>): string {
  return plantilla.replace(/\{(\w+)\}/g, (todo, clave: string) => (clave in datos ? datos[clave] : todo));
}

export function datosMensaje(cliente: Cliente, plan: Plan | undefined, ajustes: Ajustes, extra: Record<string, string> = {}) {
  return {
    contacto: cliente.contacto || cliente.negocio,
    negocio: cliente.negocio,
    plan: plan ? `plan ${plan.nombre}` : "sin plan",
    monto: lempiras(cuotaMensual(cliente, plan, ajustes)),
    fecha: fechaCorta(cliente.proximo_pago),
    limite: String(limiteProductos(cliente, plan) ?? "—"),
    mi_negocio: ajustes.nombre_negocio,
    mi_celular: formatearCelular(ajustes.codigo_pais, ajustes.celular),
    ...extra,
  };
}

/** Enlace wa.me al celular del cliente con el mensaje ya escrito (vacío si no tiene celular). */
export function enlaceWhatsApp(codigo: string, celular: string, texto = ""): string {
  const numero = numeroWhatsApp(codigo, celular);
  if (!numero) return "";
  return `https://wa.me/${numero}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export const NOMBRE_ESTADO: Record<Cliente["estado"], string> = {
  prueba: "En prueba",
  activo: "Activo",
  suspendido: "Suspendido",
  cancelado: "Cancelado",
};

export const NOMBRE_CONCEPTO = {
  mensualidad: "Mensualidad",
  instalacion: "Instalación",
  dominio: "Dominio",
  otro: "Otro",
} as const;
