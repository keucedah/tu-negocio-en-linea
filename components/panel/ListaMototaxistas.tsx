"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EstadoMototaxi } from "@/lib/panel/mototaxis";

export type FilaMototaxi = {
  id: number;
  codigo: string;
  nombre: string;
  celular: string;
  numero: string;
  foto: string | null;
  municipio: string;
  municipioIds: number[];
  estado: EstadoMototaxi;
  textoEstado: string;
  claseEstado: string;
  pagadoHasta: string;
  cuota: string;
  elegido: number;
  sinPermiso: boolean;
  /** "Ocupado hasta las …" o vacío. */
  ocupado: string;
  enlaceCobro: string;
};

const FILTROS: { id: string; texto: string; prueba: (f: FilaMototaxi) => boolean }[] = [
  { id: "todos", texto: "Todos", prueba: (f) => f.estado !== "baja" },
  { id: "suspendidos", texto: "Suspendidos", prueba: (f) => f.estado === "vencido" || f.estado === "sin_pagos" },
  { id: "por_vencer", texto: "Por vencer", prueba: (f) => f.estado === "por_vencer" },
  { id: "al_dia", texto: "Al día", prueba: (f) => f.estado === "al_dia" },
  { id: "baja", texto: "Dados de baja", prueba: (f) => f.estado === "baja" },
];

const sinTildes = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function ListaMototaxistas({ filas, municipios }: { filas: FilaMototaxi[]; municipios: { id: number; nombre: string }[] }) {
  const [buscar, setBuscar] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [municipio, setMunicipio] = useState(0);

  const visibles = useMemo(() => {
    const q = sinTildes(buscar.trim());
    const f = FILTROS.find((x) => x.id === filtro) ?? FILTROS[0];
    return filas.filter(
      (m) =>
        f.prueba(m) &&
        (!municipio || m.municipioIds.includes(municipio)) &&
        (!q || sinTildes(`${m.nombre} ${m.codigo} ${m.celular} ${m.numero}`).includes(q)),
    );
  }, [filas, buscar, filtro, municipio]);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por nombre, código o celular…" className="campo lg:max-w-xs" />
        {municipios.length > 1 && (
          <select value={municipio} onChange={(e) => setMunicipio(Number(e.target.value))} className="campo lg:max-w-[200px]" aria-label="Municipio">
            <option value={0}>Todos los municipios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        )}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium ${filtro === f.id ? "bg-marca-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"}`}
            >
              {f.texto} ({filas.filter(f.prueba).length})
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border bg-white p-8 text-center text-gray-500">No hay mototaxistas con ese filtro.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visibles.map((m) => (
            <li key={m.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {m.foto ? <img src={m.foto} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-2xl">🛺</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/mototaxistas/${m.id}`} className="font-bold hover:text-marca-700 hover:underline">
                    {m.nombre}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {m.codigo}
                    {m.numero && <> · Mototaxi N.º {m.numero}</>}
                    {m.celular && <> · {m.celular}</>}
                  </p>
                  <p className="text-xs text-gray-500">{m.municipio || "Sin municipio"}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.claseEstado}`}>{m.textoEstado}</span>
                    {m.sinPermiso && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">Falta su permiso</span>}
                    {m.ocupado && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">{m.ocupado}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-gray-500">
                  <p className="text-base font-black text-gray-900">{m.cuota}</p>
                  <p>Hasta {m.pagadoHasta}</p>
                  <p>Elegido {m.elegido} {m.elegido === 1 ? "vez" : "veces"}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                {m.enlaceCobro && m.estado !== "baja" && (
                  <a href={m.enlaceCobro} target="_blank" rel="noopener noreferrer" className="boton-whatsapp py-1.5">
                    Cobrar por WhatsApp
                  </a>
                )}
                <Link href={`/admin/mototaxistas/${m.id}#pago`} className="boton-secundario py-1.5">Registrar pago</Link>
                <Link href={`/admin/mototaxistas/${m.id}`} className="boton-secundario py-1.5">Ver / editar</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
