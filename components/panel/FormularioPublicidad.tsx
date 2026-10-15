"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPublicidad } from "@/app/admin/acciones-publicidad";
import { LADO_ANUNCIO, MEDIDA_RECOMENDADA } from "@/lib/anunciosConfig";
import { optimizarImagen } from "@/lib/optimizarImagen";
import type { TiendaAnunciante } from "@/lib/panel/publicidad";
import type { Publicidad, TipoNegocio, Ubicaciones } from "@/lib/panel/types";

export default function FormularioPublicidad({
  publicidad: p,
  tiendas,
  tipos,
  ubicaciones,
}: {
  publicidad?: Publicidad;
  tiendas: TiendaAnunciante[];
  tipos: TipoNegocio[];
  ubicaciones: Ubicaciones;
}) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(guardarPublicidad, null);
  const form = useRef<HTMLFormElement>(null);
  const [anunciante, setAnunciante] = useState<"tienda" | "externo">(p && !p.anunciante_tienda_id ? "externo" : "tienda");
  const [tipoId, setTipoId] = useState(String(p?.tipo_negocio_id ?? ""));
  const [imagen, setImagen] = useState<{ archivo: File | null; vista: string | null }>({ archivo: null, vista: p?.imagen_url ?? null });
  const [preparando, setPreparando] = useState(false);
  const esOtro = tipos.find((t) => String(t.id) === tipoId)?.nombre.toLowerCase() === "otro";
  const deptos = new Map(ubicaciones.departamentos.map((d) => [d.id, d.nombre]));

  useEffect(() => {
    if (!resultado?.ok) return;
    if (p) router.push("/admin/publicidad");
    else {
      form.current?.reset();
      setImagen({ archivo: null, vista: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);

  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        datos.delete("imagen");
        if (imagen.archivo) datos.set("imagen", imagen.archivo);
        startTransition(() => enviar(datos));
      }}
      className="space-y-4"
    >
      {p && <input type="hidden" name="id" value={p.id} />}

      <fieldset className="space-y-2">
        <legend className="etiqueta">¿Quién se anuncia?</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="anunciante" value="tienda" checked={anunciante === "tienda"} onChange={() => setAnunciante("tienda")} />
            Una tienda de tus clientes
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="anunciante" value="externo" checked={anunciante === "externo"} onChange={() => setAnunciante("externo")} />
            Otro negocio
          </label>
        </div>
        {anunciante === "tienda" ? (
          <select name="anunciante_tienda_id" defaultValue={p?.anunciante_tienda_id ?? ""} required className="campo" aria-label="Tienda que se anuncia">
            <option value="">Elige la tienda…</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}{t.tipo ? ` (${t.tipo})` : ""}{t.activa ? "" : " · suspendida"}
              </option>
            ))}
          </select>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="etiqueta">Nombre del negocio *</span>
              <input name="anunciante_nombre" required maxLength={80} defaultValue={p?.anunciante_nombre} className="campo" placeholder="Taller Hernández" />
            </label>
            <label className="block">
              <span className="etiqueta">Tipo de negocio</span>
              <select name="tipo_negocio_id" value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="campo">
                <option value="">Ninguno de la lista (sale en todas)</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </label>
            {esOtro && (
              <label className="block sm:col-span-2">
                <span className="etiqueta">¿Qué tipo de negocio es?</span>
                <input name="tipo_negocio_otro" maxLength={60} defaultValue={p?.tipo_negocio_otro} className="campo" placeholder="Taller mecánico" />
              </label>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Sale solo en tiendas con un plan con publicidad, nunca en tiendas del mismo tipo de negocio ni en la tienda que se anuncia.
        </p>
      </fieldset>

      <div className="space-y-2">
        <span className="etiqueta">Imagen *</span>
        <div className="grid aspect-video w-full max-w-sm place-items-center overflow-hidden rounded-xl border bg-gray-100 text-sm text-gray-500">
          {imagen.vista ? <img src={imagen.vista} alt="" className="h-full w-full object-contain" /> : "Sin imagen"}
        </div>
        <input
          type="file"
          name="imagen"
          accept="image/*"
          aria-label="Imagen de la publicidad"
          onChange={async (e) => {
            const elegido = e.target.files?.[0];
            if (!elegido) return;
            setPreparando(true);
            const listo = await optimizarImagen(elegido, LADO_ANUNCIO);
            setPreparando(false);
            setImagen({ archivo: listo, vista: URL.createObjectURL(listo) });
          }}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700"
        />
        <p className="text-xs text-gray-500">{preparando ? "Preparando imagen…" : `Medida recomendada: ${MEDIDA_RECOMENDADA}. Se guarda en WebP.`}</p>
      </div>

      <label className="block">
        <span className="etiqueta">Título *</span>
        <input name="titulo" required maxLength={80} defaultValue={p?.titulo} className="campo" placeholder="¡Cemento a L 210 la bolsa!" />
      </label>
      <label className="block">
        <span className="etiqueta">Texto</span>
        <textarea name="texto" rows={2} maxLength={300} defaultValue={p?.texto} className="campo" placeholder="Solo esta semana en Ferretería El Sol." />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Enlace</span>
          <input name="enlace_url" maxLength={300} defaultValue={p?.enlace_url} className="campo" placeholder={anunciante === "tienda" ? "Vacío = su tienda" : "https://…"} />
          <span className="mt-1 block text-xs text-gray-500">
            {anunciante === "tienda" ? "Vacío abre su tienda. Para una oferta, pega el enlace del producto." : "Su página, Facebook o enlace de WhatsApp."}
          </span>
        </label>
        <label className="block">
          <span className="etiqueta">Texto del botón</span>
          <input name="boton_texto" maxLength={30} defaultValue={p?.boton_texto} className="campo" placeholder={anunciante === "tienda" ? "Ver tienda" : "Ver más"} />
        </label>
        <label className="block">
          <span className="etiqueta">¿Dónde sale?</span>
          <select name="municipio_id" defaultValue={p?.municipio_id ?? ""} className="campo">
            <option value="">En todas las tiendas</option>
            {ubicaciones.municipios.map((m) => (
              <option key={m.id} value={m.id}>Solo en tiendas de {m.nombre} ({deptos.get(m.departamento_id)})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">Precio cobrado (L)</span>
          <input name="precio" inputMode="decimal" defaultValue={p?.precio ?? ""} className="campo" placeholder="Para tu control" />
        </label>
        <label className="block">
          <span className="etiqueta">Desde</span>
          <input name="inicia" type="date" defaultValue={p?.inicia ?? ""} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Hasta</span>
          <input name="termina" type="date" defaultValue={p?.termina ?? ""} className="campo" />
          <span className="mt-1 block text-xs text-gray-500">Al pasar esta fecha se quita sola.</span>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={p?.activo ?? true} className="h-4 w-4" />
        Activa
      </label>

      <button type="submit" disabled={enviando || preparando} className="boton-primario w-full">
        {enviando ? "Guardando…" : p ? "Guardar cambios" : "Crear publicidad"}
      </button>
      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{resultado.mensaje}</p>
      )}
    </form>
  );
}
