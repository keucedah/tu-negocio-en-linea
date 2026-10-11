import type { EstadoCobro } from "@/lib/negocio";
import type { EstadoCliente } from "@/lib/panel/types";
import { NOMBRE_ESTADO } from "@/lib/negocio";

const CLASE_COBRO: Record<EstadoCobro, string> = {
  vencido: "bg-red-100 text-red-800",
  por_vencer: "bg-yellow-100 text-yellow-900",
  al_dia: "bg-green-100 text-green-800",
  sin_fecha: "bg-gray-100 text-gray-700",
  no_cobra: "bg-gray-100 text-gray-500",
};

const CLASE_ESTADO: Record<EstadoCliente, string> = {
  prueba: "bg-sky-100 text-sky-800",
  activo: "bg-green-100 text-green-800",
  suspendido: "bg-red-100 text-red-800",
  cancelado: "bg-gray-200 text-gray-600",
};

export function InsigniaCobro({ estado, texto }: { estado: EstadoCobro; texto: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${CLASE_COBRO[estado]}`}>{texto}</span>;
}

export function InsigniaEstado({ estado }: { estado: EstadoCliente }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${CLASE_ESTADO[estado]}`}>{NOMBRE_ESTADO[estado]}</span>;
}
