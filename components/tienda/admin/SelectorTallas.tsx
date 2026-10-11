"use client";

import { useState } from "react";
import { GRUPOS_TALLAS, LARGO_TALLA, MAX_TALLAS, limpiarTallas } from "@/lib/tallas";

/**
 * Casilla "Tiene tallas" del formulario de producto. Al marcarla salen las tallas comunes con casillas
 * y un campo para escribir las que no estén en la lista. Se envían en el campo oculto "tallas" (JSON).
 */
export default function SelectorTallas({ iniciales = [] }: { iniciales?: string[] }) {
  const [activo, setActivo] = useState(iniciales.length > 0);
  const [elegidas, setElegidas] = useState<string[]>(iniciales);
  const [otra, setOtra] = useState("");
  // Se ve un grupo a la vez (Ropa, Calzado…): empieza en el que más tallas del producto tiene
  const [grupo, setGrupo] = useState(() => {
    const puntos = GRUPOS_TALLAS.map((g) => g.tallas.filter((t) => iniciales.some((i) => i.toLowerCase() === t.toLowerCase())).length);
    return Math.max(0, puntos.indexOf(Math.max(...puntos)));
  });
  const comunes = new Set(GRUPOS_TALLAS.flatMap((g) => g.tallas.map((t) => t.toLowerCase())));
  const propias = elegidas.filter((t) => !comunes.has(t.toLowerCase()));
  const marcada = (t: string) => elegidas.some((e) => e.toLowerCase() === t.toLowerCase());

  const cambiar = (t: string) =>
    setElegidas((l) => (marcada(t) ? l.filter((e) => e.toLowerCase() !== t.toLowerCase()) : limpiarTallas([...l, t])));

  const agregarOtra = () => {
    // Se pueden escribir varias separadas por coma: "46, 47"
    const nuevas = otra.split(",").map((t) => t.trim()).filter(Boolean);
    if (nuevas.length) setElegidas((l) => limpiarTallas([...l, ...nuevas]));
    setOtra("");
  };

  const casilla = (t: string) => (
    <label
      key={t}
      className={`cursor-pointer select-none rounded-lg border px-2.5 py-1 text-sm transition ${
        marcada(t) ? "border-marca-600 bg-marca-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-marca-500"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={marcada(t)} onChange={() => cambiar(t)} />
      {t}
    </label>
  );

  return (
    <div className="rounded-lg border px-3 py-2">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="con_tallas" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>
          <span className="font-medium">Tiene tallas</span>
          <span className="block text-xs text-gray-600">Para calzado, ropa y todo lo que se pide por medida. El cliente elige su talla al agregarlo.</span>
        </span>
      </label>

      {activo && (
        <div className="mt-3 space-y-3">
          <input type="hidden" name="tallas" value={JSON.stringify(elegidas)} />
          <div>
            <div className="mb-2 flex flex-wrap gap-1 border-b pb-2" role="tablist" aria-label="Tipo de talla">
              {GRUPOS_TALLAS.map((g, i) => (
                <button
                  key={g.nombre}
                  type="button"
                  role="tab"
                  aria-selected={i === grupo}
                  onClick={() => setGrupo(i)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    i === grupo ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {g.nombre}
                </button>
              ))}
            </div>
            <fieldset>
              <legend className="sr-only">{GRUPOS_TALLAS[grupo].nombre}</legend>
              <div className="flex flex-wrap gap-1.5">{GRUPOS_TALLAS[grupo].tallas.map(casilla)}</div>
            </fieldset>
          </div>

          <fieldset>
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Otra talla</legend>
            {propias.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{propias.map(casilla)}</div>}
            <div className="flex gap-2">
              <input
                value={otra}
                onChange={(e) => setOtra(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarOtra();
                  }
                }}
                maxLength={LARGO_TALLA * 4}
                placeholder="Ej.: 46, Única, 10.5"
                className="campo"
                aria-label="Escribir otra talla"
              />
              <button type="button" onClick={agregarOtra} className="boton-secundario shrink-0">
                Agregar
              </button>
            </div>
          </fieldset>

          <p className="text-xs text-gray-600">
            {elegidas.length === 0
              ? "Marca las tallas que tienes disponibles."
              : `Tallas elegidas (${elegidas.length}${elegidas.length >= MAX_TALLAS ? `, máximo ${MAX_TALLAS}` : ""}): ${elegidas.join(", ")}`}
          </p>
        </div>
      )}
    </div>
  );
}
