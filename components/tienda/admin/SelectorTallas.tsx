"use client";

import { useState } from "react";
import { GRUPOS_TALLAS, LARGO_TALLA, MAX_TALLAS, limpiarTallas, palabraMedida, type GrupoMedidas } from "@/lib/tallas";

/**
 * Casilla "Tiene tallas" del formulario de producto. Al marcarla salen las tallas comunes con casillas
 * y un campo para escribir las que no estén en la lista. Se envían en el campo oculto "tallas" (JSON).
 * Desde la 2.7 la palabra (talla, medida, presentación…) y los grupos son los del tipo de negocio de la tienda,
 * y "usadas" son las que el dueño ya escribió en otros productos, para marcarlas de un toque.
 */
export default function SelectorTallas({
  iniciales = [],
  palabra: palabraTienda = "talla",
  grupos: gruposTienda = GRUPOS_TALLAS,
  usadas = [],
}: {
  iniciales?: string[];
  palabra?: string;
  grupos?: GrupoMedidas[];
  usadas?: string[];
}) {
  const palabra = palabraMedida(palabraTienda);
  const otraPalabra = palabra.femenina ? "otra" : "otro";
  const GRUPOS = gruposTienda;
  const [activo, setActivo] = useState(iniciales.length > 0);
  const [elegidas, setElegidas] = useState<string[]>(iniciales);
  const [otra, setOtra] = useState("");
  // Se ve un grupo a la vez (Ropa, Calzado…): empieza en el que más tallas del producto tiene
  const [grupo, setGrupo] = useState(() => {
    const puntos = GRUPOS.map((g) => g.tallas.filter((t) => iniciales.some((i) => i.toLowerCase() === t.toLowerCase())).length);
    return Math.max(0, puntos.indexOf(Math.max(...puntos)));
  });
  const comunes = new Set(GRUPOS.flatMap((g) => g.tallas.map((t) => t.toLowerCase())));
  // Escritas a mano: las de este producto y, para marcar de un toque, las que ya usó en otros productos
  const propias = limpiarTallas([...elegidas.filter((t) => !comunes.has(t.toLowerCase())), ...usadas.filter((t) => !comunes.has(t.toLowerCase()))]);
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
          <span className="font-medium">Tiene {palabra.varias}</span>
          <span className="block text-xs text-gray-600">
            Si este producto viene en varias {palabra.varias}. El cliente elige su {palabra.una} al agregarlo y le llega en el pedido.
          </span>
        </span>
      </label>

      {activo && (
        <div className="mt-3 space-y-3">
          <input type="hidden" name="tallas" value={JSON.stringify(elegidas)} />
          {GRUPOS.length > 0 && (
          <div>
            <div className="mb-2 flex flex-wrap gap-1 border-b pb-2" role="tablist" aria-label={`Grupos de ${palabra.varias}`}>
              {GRUPOS.map((g, i) => (
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
              <legend className="sr-only">{GRUPOS[grupo].nombre}</legend>
              <div className="flex flex-wrap gap-1.5">{GRUPOS[grupo].tallas.map(casilla)}</div>
            </fieldset>
          </div>
          )}

          <fieldset>
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {usadas.length > 0 ? `Tus ${palabra.varias} y ${otraPalabra} ${palabra.una}` : `${otraPalabra} ${palabra.una}`}
            </legend>
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
                placeholder={palabra.una === "talla" ? "Ej.: 46, Única, 10.5" : "Escribe una o varias, separadas por coma"}
                className="campo"
                aria-label={`Escribir ${otraPalabra} ${palabra.una}`}
              />
              <button type="button" onClick={agregarOtra} className="boton-secundario shrink-0">
                Agregar
              </button>
            </div>
          </fieldset>

          <p className="text-xs text-gray-600">
            {elegidas.length === 0
              ? `Marca las ${palabra.varias} que tienes disponibles.`
              : `${palabra.Varias} ${palabra.femenina ? "elegidas" : "elegidos"} (${elegidas.length}${elegidas.length >= MAX_TALLAS ? `, máximo ${MAX_TALLAS}` : ""}): ${elegidas.join(", ")}`}
          </p>
        </div>
      )}
    </div>
  );
}
