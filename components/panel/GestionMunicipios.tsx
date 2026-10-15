"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BotonAccion from "./BotonAccion";
import Formulario from "./Formulario";
import { crearMunicipio, eliminarMunicipio, renombrarMunicipio } from "@/app/admin/acciones-mototaxis";
import type { Ubicaciones } from "@/lib/panel/types";

/** Municipios que agregaste: agregar, corregir el nombre o eliminar (si nadie lo usa). */
export default function GestionMunicipios({ ubicaciones, usos }: { ubicaciones: Ubicaciones; usos: Record<number, number> }) {
  const router = useRouter();
  const valle = ubicaciones.departamentos.find((d) => d.nombre === "Valle")?.id ?? ubicaciones.departamentos[0]?.id ?? 0;
  const [depto, setDepto] = useState(valle);
  const [nombre, setNombre] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [pendiente, iniciar] = useTransition();

  const grupos = ubicaciones.departamentos
    .map((d) => ({ ...d, municipios: ubicaciones.municipios.filter((m) => m.departamento_id === d.id) }))
    .filter((d) => d.municipios.length > 0);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAviso(null);
          iniciar(async () => {
            const r = await crearMunicipio(depto, nombre);
            setAviso({ ok: r.ok, texto: r.mensaje });
            if (r.ok) {
              setNombre("");
              router.refresh();
            }
          });
        }}
        className="flex flex-wrap gap-2"
      >
        <select value={depto} onChange={(e) => setDepto(Number(e.target.value))} className="campo w-auto" aria-label="Departamento">
          {ubicaciones.departamentos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} className="campo min-w-[160px] flex-1" placeholder="Nombre del municipio" aria-label="Municipio nuevo" />
        <button disabled={pendiente || !nombre.trim()} className="boton-primario">{pendiente ? "…" : "+ Agregar"}</button>
      </form>
      {aviso && <p className={`text-sm ${aviso.ok ? "text-green-700" : "text-red-600"}`}>{aviso.texto}</p>}

      {grupos.map((d) => (
        <div key={d.id}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{d.nombre}</p>
          <ul className="divide-y text-sm">
            {d.municipios.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                {editando === m.id ? (
                  <Formulario accion={renombrarMunicipio} boton="Guardar" className="flex flex-1 flex-wrap items-start gap-2" claseBoton="boton-primario py-1.5">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="nombre" defaultValue={m.nombre} maxLength={60} className="campo flex-1 py-1.5" aria-label="Nombre" autoFocus />
                  </Formulario>
                ) : (
                  <span>
                    {m.nombre} <span className="text-xs text-gray-400">({usos[m.id] ?? 0} {usos[m.id] === 1 ? "uso" : "usos"})</span>
                  </span>
                )}
                <span className="flex items-center gap-3">
                  <button type="button" onClick={() => setEditando(editando === m.id ? null : m.id)} className="text-sm font-medium text-marino-700 hover:underline">
                    {editando === m.id ? "Cerrar" : "Corregir"}
                  </button>
                  <BotonAccion accion={eliminarMunicipio.bind(null, m.id)} confirmacion={`¿Eliminar el municipio “${m.nombre}”?`}>
                    Eliminar
                  </BotonAccion>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
