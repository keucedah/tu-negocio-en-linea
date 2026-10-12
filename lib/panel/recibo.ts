// Datos de un recibo de pago, listos para el botón que arma el PDF en el navegador.
import { NOMBRE_CONCEPTO, fechaCorta } from "../negocio";
import { formatearCelular, numeroWhatsApp } from "../telefono";
import type { Ajustes, Cliente, Pago } from "./types";

export type DatosRecibo = {
  numero: string;
  fecha: string;
  emisor: { nombre: string; eslogan: string; direccion: string; celular: string; correo: string };
  cliente: { negocio: string; contacto: string; celular: string; direccion: string; correo: string; whatsapp: string };
  concepto: string;
  plan: string;
  monto: number;
  metodo: string;
  nota: string;
  pagadoHasta: string;
  archivo: string;
};

/** "FESO-0001" */
export const numeroRecibo = (p: Pick<Pago, "serie_recibo" | "numero_recibo">) =>
  `${p.serie_recibo ? p.serie_recibo + "-" : ""}${String(p.numero_recibo).padStart(4, "0")}`;

export function datosRecibo(pago: Pago, cliente: Cliente | undefined, ajustes: Ajustes): DatosRecibo {
  const numero = numeroRecibo(pago);
  const negocio = cliente?.negocio ?? "Cliente";
  const concepto =
    NOMBRE_CONCEPTO[pago.concepto] + (pago.concepto === "mensualidad" ? ` (${pago.meses === 1 ? "1 mes" : `${pago.meses} meses`})` : "");
  const slug = negocio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return {
    numero,
    fecha: fechaCorta(pago.fecha),
    emisor: {
      nombre: ajustes.nombre_negocio,
      eslogan: ajustes.eslogan,
      direccion: ajustes.direccion,
      celular: formatearCelular(ajustes.codigo_pais, ajustes.celular),
      correo: ajustes.correo,
    },
    cliente: {
      negocio,
      contacto: cliente?.contacto ?? "",
      celular: cliente ? formatearCelular(cliente.codigo_pais, cliente.celular) : "",
      direccion: cliente?.direccion ?? "",
      correo: cliente?.correo ?? "",
      whatsapp: cliente ? numeroWhatsApp(cliente.codigo_pais, cliente.celular) : "",
    },
    concepto,
    plan: pago.plan_nombre,
    monto: pago.monto,
    metodo: pago.metodo,
    nota: pago.nota,
    pagadoHasta: pago.pagado_hasta ? fechaCorta(pago.pagado_hasta) : "",
    archivo: `Recibo-${numero}-${slug || "cliente"}.pdf`,
  };
}
