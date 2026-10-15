"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useActionState, useState } from "react";
import SelectorMunicipio from "./SelectorMunicipio";
import { guardarMototaxista } from "@/app/admin/acciones-mototaxis";
import { PAISES } from "@/lib/telefono";
import { optimizarImagen } from "@/lib/optimizarImagen";
import { fechaCorta, lempiras } from "@/lib/negocio";
import type { Mototaxista, Ubicaciones } from "@/lib/panel/types";

type Foto = { archivo: File | null; vista: string | null; quitar: boolean };

function CampoFoto({
  titulo,
  ayuda,
  foto,
  original,
  redonda,
  alCambiar,
}: {
  titulo: string;
  ayuda: string;
  foto: Foto;
  original: string | null;
  redonda?: boolean;
  alCambiar: (f: Foto) => void;
}) {
  const [preparando, setPreparando] = useState(false);
  const vista = foto.quitar ? null : foto.vista;
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden bg-gray-100 text-3xl ${redonda ? "rounded-full" : "rounded-xl"}`}>
        {vista ? <img src={vista} alt="" className="h-full w-full object-cover" /> : redonda ? "🙂" : "🛺"}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="etiqueta">{titulo}</span>
        <input
          type="file"
          accept="image/*"
          aria-label={titulo}
          onChange={async (e) => {
            const elegido = e.target.files?.[0];
            if (!elegido) return;
            setPreparando(true);
            const listo = await optimizarImagen(elegido, 900);
            setPreparando(false);
            alCambiar({ archivo: listo, vista: URL.createObjectURL(listo), quitar: false });
          }}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700"
        />
        <p className="text-xs text-gray-500">{preparando ? "Preparando foto…" : ayuda}</p>
        {original && !foto.archivo && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={foto.quitar} onChange={(e) => alCambiar({ ...foto, quitar: e.target.checked })} />
            Quitar esta foto
          </label>
        )}
      </div>
    </div>
  );
}

export default function FormularioMototaxista({
  mototaxista: m,
  ubicaciones,
  cuotaNormal,
  hoy,
}: {
  mototaxista?: Mototaxista;
  ubicaciones: Ubicaciones;
  cuotaNormal: number;
  hoy: string;
}) {
  const [resultado, enviar, enviando] = useActionState(guardarMototaxista, null);
  const [foto, setFoto] = useState<Foto>({ archivo: null, vista: m?.foto_url ?? null, quitar: false });
  const [moto, setMoto] = useState<Foto>({ archivo: null, vista: m?.foto_moto_url ?? null, quitar: false });
  const [municipios, setMunicipios] = useState(ubicaciones.municipios);
  const [acepto, setAcepto] = useState(m?.acepto_publicar ?? false);

  const deptos = new Map(ubicaciones.departamentos.map((d) => [d.id, d.nombre]));

  return (
    <form
      // Se envía a mano para que el formulario no se borre si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        if (foto.archivo) datos.set("foto", foto.archivo);
        if (moto.archivo) datos.set("foto_moto", moto.archivo);
        if (foto.quitar) datos.set("quitar_foto", "on");
        if (moto.quitar) datos.set("quitar_foto_moto", "on");
        startTransition(() => enviar(datos));
      }}
      className="space-y-4"
    >
      {m && <input type="hidden" name="id" value={m.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoFoto titulo="Foto del mototaxista" ayuda="De frente, que se vea bien la cara." foto={foto} original={m?.foto_url ?? null} redonda alCambiar={setFoto} />
        <CampoFoto titulo="Foto de la mototaxi" ayuda="Que se vea el color y el número." foto={moto} original={m?.foto_moto_url ?? null} alCambiar={setMoto} />
      </div>

      <label className="block">
        <span className="etiqueta">Nombre completo *</span>
        <input name="nombre" required maxLength={80} defaultValue={m?.nombre} className="campo" placeholder="Juan Pérez" />
      </label>
      <div>
        <span className="etiqueta">Celular / WhatsApp * (ahí le llegan los pedidos)</span>
        <div className="flex gap-2">
          <select name="codigo_pais" defaultValue={m?.codigo_pais ?? "504"} className="campo w-40 shrink-0" aria-label="País">
            {PAISES.map((p) => (
              <option key={p.codigo} value={p.codigo}>{p.nombre} (+{p.codigo})</option>
            ))}
          </select>
          <input name="celular" required inputMode="tel" defaultValue={m?.celular} className="campo" placeholder="9999 9999" aria-label="Celular" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Número de identidad</span>
          <input name="identidad" maxLength={30} defaultValue={m?.identidad} className="campo" placeholder="0000-0000-00000" />
          <span className="mt-1 block text-xs text-gray-500">Privado: solo lo ves tú, nunca sale en las tiendas.</span>
        </label>
        <label className="block">
          <span className="etiqueta">Número de mototaxi</span>
          <input name="numero_mototaxi" maxLength={20} defaultValue={m?.numero_mototaxi} className="campo" placeholder="Si tiene" />
        </label>
      </div>
      <label className="block">
        <span className="etiqueta">Dirección</span>
        <input name="direccion" maxLength={200} defaultValue={m?.direccion} className="campo" placeholder="Barrio, colonia o punto de referencia" />
      </label>

      <SelectorMunicipio
        ubicaciones={ubicaciones}
        valor={m?.municipio_id}
        obligatorio
        etiqueta="Municipio donde trabaja"
        ayuda="Sale en las tiendas de este municipio."
        alCambiar={setMunicipios}
      />
      {municipios.length > 1 && (
        <fieldset>
          <legend className="etiqueta">También trabaja en (opcional)</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {municipios.map((x) => (
              <label key={x.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="municipios_extra" value={x.id} defaultChecked={m?.municipios_extra.includes(x.id)} className="h-4 w-4" />
                {x.nombre} <span className="text-xs text-gray-400">({deptos.get(x.departamento_id)})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Mensualidad especial (L)</span>
          <input name="cuota_personalizada" inputMode="decimal" defaultValue={m?.cuota_personalizada ?? ""} className="campo" placeholder={`Normal: ${lempiras(cuotaNormal)}`} />
          <span className="mt-1 block text-xs text-gray-500">Vacío = la mensualidad normal de Ajustes.</span>
        </label>
        {!m && (
          <label className="block">
            <span className="etiqueta">Pagado hasta (opcional)</span>
            <input name="pagado_hasta" type="date" min={hoy} className="campo" />
            <span className="mt-1 block text-xs text-gray-500">Vacío = queda suspendido hasta que registres su primer pago.</span>
          </label>
        )}
      </div>

      <label className={`flex items-start gap-2 rounded-xl p-3 text-sm ${acepto ? "bg-green-50" : "bg-orange-50"}`}>
        <input type="checkbox" name="acepto_publicar" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>
          <b>Aceptó que publiquemos sus datos.</b> El mototaxista está de acuerdo en que su foto, nombre, celular, dirección y los datos de su mototaxi salgan en las tiendas.
          {m?.acepto_publicar && m.acepto_fecha && <span className="block text-xs text-gray-600">Aceptó el {fechaCorta(m.acepto_fecha)}.</span>}
          {!acepto && <span className="block text-xs text-orange-800">Sin esta casilla no sale en ninguna tienda.</span>}
        </span>
      </label>

      {m && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activo" defaultChecked={m.activo} className="h-4 w-4" />
          Activo (desmárcalo para darlo de baja: deja de salir en las tiendas)
        </label>
      )}

      <label className="block">
        <span className="etiqueta">Notas</span>
        <textarea name="notas" rows={2} maxLength={1000} defaultValue={m?.notas} className="campo" placeholder="Horario, zona preferida, etc." />
      </label>

      <button type="submit" disabled={enviando} className="boton-primario w-full">
        {enviando ? "Guardando…" : m ? "Guardar cambios" : "Agregar mototaxista"}
      </button>
      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{resultado.mensaje}</p>
      )}
    </form>
  );
}
