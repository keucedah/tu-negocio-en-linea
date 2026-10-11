"use client";

import { useState, useTransition } from "react";
import type { Resultado } from "@/app/acciones-tienda";

/** Estrella para poner o quitar un producto del carrusel "Lo más vendido". */
export default function BotonDestacado({
  id,
  nombre,
  destacado,
  accion,
  conTexto = false,
}: {
  id: number;
  nombre: string;
  destacado: boolean;
  accion: (fd: FormData) => Promise<Resultado>;
  conTexto?: boolean;
}) {
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="relative inline-flex flex-col items-end">
      <button
        type="button"
        disabled={enviando}
        onClick={() =>
          iniciar(async () => {
            const fd = new FormData();
            fd.set("id", String(id));
            fd.set("destacado", destacado ? "0" : "1");
            const r = await accion(fd);
            setError(r && !r.ok ? r.mensaje : null);
          })
        }
        title={destacado ? "Quitar de lo más vendido" : "Agregar a lo más vendido"}
        aria-pressed={destacado}
        aria-label={`${destacado ? "Quitar de" : "Agregar a"} lo más vendido: ${nombre}`}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium transition disabled:opacity-50 ${
          destacado ? "text-amber-500 hover:bg-amber-50" : "text-gray-300 hover:bg-gray-100 hover:text-amber-400"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill={destacado ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        {conTexto && <span className="hidden text-gray-700 sm:inline">{destacado ? "Quitar" : "Destacar"}</span>}
      </button>
      {error && <span className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 shadow">{error}</span>}
    </span>
  );
}
