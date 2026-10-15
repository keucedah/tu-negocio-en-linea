"use client";

import { useState, useTransition } from "react";
import { crearMunicipio } from "@/app/admin/acciones-mototaxis";
import type { Municipio, Ubicaciones } from "@/lib/panel/types";

/**
 * Departamento + municipio, con "+ Nuevo municipio" en el mismo formulario.
 * El municipio nuevo se guarda al instante y queda elegido (si ya existía, se elige ese).
 */
export default function SelectorMunicipio({
  ubicaciones,
  nombre = "municipio_id",
  valor,
  obligatorio = false,
  etiqueta = "Municipio",
  ayuda,
  alCambiar,
}: {
  ubicaciones: Ubicaciones;
  nombre?: string;
  valor?: number | null;
  obligatorio?: boolean;
  etiqueta?: string;
  ayuda?: string;
  alCambiar?: (municipios: Municipio[]) => void;
}) {
  const [municipios, setMunicipios] = useState(ubicaciones.municipios);
  const inicial = municipios.find((m) => m.id === valor);
  const porDefecto = ubicaciones.departamentos.find((d) => d.nombre === "Valle")?.id ?? ubicaciones.departamentos[0]?.id ?? 0;
  const [depto, setDepto] = useState<number>(inicial?.departamento_id ?? porDefecto);
  const [municipio, setMunicipio] = useState<string>(inicial ? String(inicial.id) : "");
  const [agregando, setAgregando] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendiente, iniciar] = useTransition();

  if (ubicaciones.departamentos.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Para elegir el municipio, ejecuta primero <b>actualizacion-2.5.sql</b> en Supabase.
      </p>
    );
  }

  const delDepto = municipios.filter((m) => m.departamento_id === depto);

  function agregar() {
    setAviso(null);
    iniciar(async () => {
      const r = await crearMunicipio(depto, nuevo);
      setAviso({ ok: r.ok, texto: r.mensaje });
      if (r.ok && r.municipio) {
        const m = r.municipio;
        const lista = municipios.some((x) => x.id === m.id) ? municipios : [...municipios, m].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setMunicipios(lista);
        alCambiar?.(lista);
        setMunicipio(String(m.id));
        setNuevo("");
        setAgregando(false);
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Departamento</span>
          <select
            value={depto}
            onChange={(e) => {
              setDepto(Number(e.target.value));
              setMunicipio("");
            }}
            className="campo"
          >
            {ubicaciones.departamentos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">{etiqueta}{obligatorio ? " *" : ""}</span>
          <select name={nombre} value={municipio} onChange={(e) => setMunicipio(e.target.value)} required={obligatorio} className="campo">
            <option value="">{delDepto.length ? "Elige…" : "Sin municipios: agrega uno"}</option>
            {delDepto.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </label>
      </div>
      {agregando ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (nuevo.trim()) agregar();
              }
            }}
            maxLength={60}
            className="campo flex-1 py-1.5"
            placeholder="Nombre del municipio"
            aria-label="Nombre del municipio nuevo"
            autoFocus
          />
          <button type="button" onClick={agregar} disabled={pendiente || !nuevo.trim()} className="boton-primario py-1.5">
            {pendiente ? "…" : "Agregar"}
          </button>
          <button type="button" onClick={() => setAgregando(false)} className="text-sm text-gray-500 hover:underline">
            Cancelar
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => { setAgregando(true); setAviso(null); }} className="text-sm font-semibold text-marino-700 hover:underline">
          + Nuevo municipio
        </button>
      )}
      {aviso && <p className={`text-xs ${aviso.ok ? "text-green-700" : "text-red-600"}`}>{aviso.texto}</p>}
      {ayuda && <p className="text-xs text-gray-500">{ayuda}</p>}
    </div>
  );
}
