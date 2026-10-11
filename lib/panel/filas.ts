import { COLOR_PLAN } from "./colores";
import { cuotaMensual, datosMensaje, enlaceWhatsApp, estadoCobro, fechaCorta, lempiras, limiteProductos, llenarPlantilla, textoCobro } from "../negocio";
import { formatearCelular } from "../telefono";
import type { Ajustes, Cliente, Plan, TipoNegocio } from "./types";
import type { FilaCliente } from "@/components/panel/ListaClientes";

/** Mensaje de cobro: recordatorio si aún no vence, aviso de atraso si ya venció. */
export function mensajeCobro(c: Cliente, plan: Plan | undefined, a: Ajustes): string {
  const { estado } = estadoCobro(c, a.dias_aviso);
  return llenarPlantilla(estado === "vencido" ? a.plantilla_vencido : a.plantilla_cobro, datosMensaje(c, plan, a));
}

export function aFila(c: Cliente, planes: Plan[], a: Ajustes, tipos: TipoNegocio[] = []): FilaCliente {
  const plan = planes.find((p) => p.id === c.plan_id);
  const cobro = estadoCobro(c, a.dias_aviso);
  const saludo = `Hola ${c.contacto || c.negocio}, le saluda ${a.nombre_negocio}. `;
  return {
    id: c.id,
    negocio: c.negocio,
    tipo: c.tipo_negocio_otro || tipos.find((t) => t.id === c.tipo_negocio_id)?.nombre || "",
    contacto: c.contacto,
    celular: formatearCelular(c.codigo_pais, c.celular),
    plan: plan ? `Plan ${plan.nombre}` : "Sin plan",
    claseplan: plan ? COLOR_PLAN[plan.color].insignia : "bg-gray-100 text-gray-600",
    limite: limiteProductos(c, plan)?.toLocaleString("es-HN") ?? "—",
    cuota: lempiras(cuotaMensual(c, plan, a)),
    estado: c.estado,
    cobro: cobro.estado,
    textoCobro: textoCobro(cobro),
    proximo: fechaCorta(c.proximo_pago),
    enlaceCobro: c.estado === "cancelado" ? "" : enlaceWhatsApp(c.codigo_pais, c.celular, mensajeCobro(c, plan, a)),
    enlaceMensaje: enlaceWhatsApp(c.codigo_pais, c.celular, saludo),
  };
}
