"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useState } from "react";
import type { Resultado } from "@/app/acciones-tienda";
import { PAISES, formatearCelular, normalizarCelular } from "@/lib/telefono";
import { optimizarCampo } from "@/lib/optimizarImagen";
import type { FilaTienda } from "@/lib/tienda/types";

type Props = {
  config: FilaTienda;
  accion: (prev: Resultado, fd: FormData) => Promise<Resultado>;
};

export default function FormularioTienda({ config, accion }: Props) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const [codigo, setCodigo] = useState(config.codigo_pais);
  const [celular, setCelular] = useState(config.celular);
  const [vista, setVista] = useState<string | null>(config.logo_url);
  const [quitar, setQuitar] = useState(false);
  const [optimizando, setOptimizando] = useState(false);

  const cel = normalizarCelular(codigo, celular);

  return (
    <form action={enviar} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nombre de la tienda</span>
        <input name="nombre_tienda" required maxLength={60} defaultValue={config.nombre_tienda} className="campo" />
      </label>

      <div className="space-y-1">
        <span className="text-sm font-medium">Logo</span>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-encabezado text-xs text-gray-400">
            {vista && !quitar ? <img src={vista} alt="Logo" className="h-full w-full object-contain" /> : "Sin logo"}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={async (e) => {
                const input = e.currentTarget;
                if (!input.files?.[0]) {
                  setVista(config.logo_url);
                  return;
                }
                setOptimizando(true);
                const f = await optimizarCampo(input, 600);
                setOptimizando(false);
                setVista(f ? URL.createObjectURL(f) : config.logo_url);
                if (f) setQuitar(false);
              }}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700 hover:file:bg-marca-100"
            />
            {config.logo_url && (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" name="quitar_logo" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} />
                Quitar el logo actual
              </label>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500">Recomendado: PNG con fondo transparente, se ve sobre la barra de arriba.</p>
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Celular / WhatsApp para pedidos</span>
        <div className="flex gap-2">
          <select name="codigo_pais" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="campo w-40 shrink-0" aria-label="País">
            {PAISES.map((p) => (
              <option key={p.codigo + p.nombre} value={p.codigo}>
                {p.nombre} (+{p.codigo})
              </option>
            ))}
          </select>
          <input
            name="celular"
            type="tel"
            inputMode="tel"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="Número"
            className="campo"
          />
        </div>
        <p className={`text-xs ${cel.ok ? "text-gray-600" : "text-red-600"}`}>
          {cel.ok
            ? cel.nacional
              ? <>Se mostrará como <strong>{formatearCelular(cel.codigo, cel.nacional)}</strong></>
              : "Sin número, el botón de WhatsApp quedará desactivado."
            : cel.error}
        </p>
      </div>

      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {resultado.mensaje}
        </p>
      )}

      <button type="submit" disabled={enviando || optimizando || !cel.ok} className="boton-primario w-full">
        {enviando ? "Guardando…" : "Guardar datos de la tienda"}
      </button>
    </form>
  );
}
