"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InsigniaCobro, InsigniaEstado } from "./Insignias";
import type { EstadoCobro } from "@/lib/negocio";
import type { EstadoCliente } from "@/lib/panel/types";

export type FilaCliente = {
  id: number;
  negocio: string;
  tipo: string;
  contacto: string;
  celular: string;
  plan: string;
  claseplan: string;
  limite: string;
  cuota: string;
  estado: EstadoCliente;
  cobro: EstadoCobro;
  textoCobro: string;
  proximo: string;
  enlaceCobro: string;
  enlaceMensaje: string;
};

const FILTROS: { id: string; texto: string; prueba: (f: FilaCliente) => boolean }[] = [
  { id: "todos", texto: "Todos", prueba: () => true },
  { id: "vencido", texto: "Vencidos", prueba: (f) => f.cobro === "vencido" },
  { id: "por_vencer", texto: "Por vencer", prueba: (f) => f.cobro === "por_vencer" },
  { id: "al_dia", texto: "Al día", prueba: (f) => f.cobro === "al_dia" },
  { id: "prueba", texto: "En prueba", prueba: (f) => f.estado === "prueba" },
  { id: "suspendido", texto: "Suspendidos", prueba: (f) => f.estado === "suspendido" },
  { id: "cancelado", texto: "Cancelados", prueba: (f) => f.estado === "cancelado" },
];

export default function ListaClientes({ filas, filtroInicial = "todos" }: { filas: FilaCliente[]; filtroInicial?: string }) {
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState(filtroInicial);

  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const f = FILTROS.find((x) => x.id === filtro) ?? FILTROS[0];
    return filas.filter(
      (c) =>
        f.prueba(c) &&
        (!q || `${c.negocio} ${c.tipo} ${c.contacto} ${c.celular}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)),
    );
  }, [filas, buscar, filtro]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por negocio, tipo, contacto o celular…" className="campo sm:max-w-xs" />
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTROS.map((f) => {
            const n = filas.filter(f.prueba).length;
            return (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${filtro === f.id ? "bg-marca-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
              >
                {f.texto} ({n})
              </button>
            );
          })}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-gray-500">No hay clientes con ese filtro.</p>
      ) : (
        <ul className="space-y-3">
          {visibles.map((c) => (
            <li key={c.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/clientes/${c.id}`} className="text-lg font-bold hover:text-marca-700 hover:underline">
                    {c.negocio}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {c.tipo && <>{c.tipo} · </>}
                    {c.contacto || "Sin contacto"}
                    {c.celular && <> · {c.celular}</>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.claseplan}`}>{c.plan}</span>
                    <InsigniaEstado estado={c.estado} />
                    <InsigniaCobro estado={c.cobro} texto={c.textoCobro} />
                  </div>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="text-xl font-black">{c.cuota}<span className="text-xs font-normal text-gray-500">/mes</span></p>
                  <p className="text-gray-500">Próximo pago: {c.proximo}</p>
                  <p className="text-gray-500">Límite: {c.limite} productos</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                {c.enlaceCobro && (
                  <a href={c.enlaceCobro} target="_blank" rel="noopener noreferrer" className="boton-whatsapp py-1.5">
                    Cobrar por WhatsApp
                  </a>
                )}
                {c.enlaceMensaje && (
                  <a href={c.enlaceMensaje} target="_blank" rel="noopener noreferrer" className="boton-secundario py-1.5">
                    Mensaje
                  </a>
                )}
                <Link href={`/admin/clientes/${c.id}#pago`} className="boton-secundario py-1.5">Registrar pago</Link>
                <Link href={`/admin/clientes/${c.id}`} className="boton-secundario py-1.5">Ver / editar</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
