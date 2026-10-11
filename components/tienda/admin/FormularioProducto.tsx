"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useRef, useState } from "react";
import type { Categoria, Producto } from "@/lib/tienda/types";
import type { Resultado } from "@/app/acciones-tienda";
import { formatoPeso, optimizarCampo } from "@/lib/optimizarImagen";

type Props = {
  categorias: Categoria[];
  accion: (prev: Resultado, fd: FormData) => Promise<Resultado>;
  producto?: Producto;
};

export default function FormularioProducto({ categorias, accion, producto }: Props) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [vista, setVista] = useState<string | null>(producto?.imagen_url ?? null);
  const [peso, setPeso] = useState<string | null>(null);
  const [optimizando, setOptimizando] = useState(false);
  const editando = Boolean(producto);

  useEffect(() => {
    if (resultado?.ok && !editando) {
      formRef.current?.reset();
      setVista(null);
      setPeso(null);
    }
  }, [resultado, editando]);

  return (
    <form ref={formRef} action={enviar} className="space-y-4">
      {producto && <input type="hidden" name="id" value={producto.id} />}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Imagen {editando && <span className="font-normal text-gray-500">(deja vacío para mantener la actual)</span>}</span>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-100 text-xs text-gray-400">
            {vista ? <img src={vista} alt="Vista previa" className="h-full w-full object-cover" /> : "Sin imagen"}
          </div>
          <input
            name="imagen"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required={!editando}
            onChange={async (e) => {
              const input = e.currentTarget;
              const original = input.files?.[0];
              setPeso(null);
              if (!original) {
                setVista(producto?.imagen_url ?? null);
                return;
              }
              setOptimizando(true);
              const f = (await optimizarCampo(input)) ?? original;
              setOptimizando(false);
              setVista(URL.createObjectURL(f));
              setPeso(f === original ? formatoPeso(f.size) : `${formatoPeso(f.size)} (antes ${formatoPeso(original.size)})`);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700 hover:file:bg-marca-100"
          />
        </div>
        {(optimizando || peso) && (
          <span className="block text-xs text-gray-500">{optimizando ? "Optimizando foto…" : `Foto lista: ${peso}`}</span>
        )}
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Nombre</span>
        <input name="nombre" required maxLength={150} defaultValue={producto?.nombre} className="campo" />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Descripción</span>
        <textarea name="descripcion" rows={4} maxLength={3000} defaultValue={producto?.descripcion} className="campo" />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Categoría</span>
        <select name="categoria_id" required defaultValue={producto?.categoria_id ?? ""} className="campo">
          <option value="" disabled>
            Elige una categoría…
          </option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm">
        <input type="checkbox" name="destacado" defaultChecked={producto?.destacado ?? false} className="mt-0.5 h-4 w-4" />
        <span>
          <span className="font-medium">Lo más vendido</span>
          <span className="block text-xs text-gray-600">Aparece en el carrusel de arriba del catálogo (hasta 12 productos).</span>
        </span>
      </label>

      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {resultado.mensaje}
        </p>
      )}

      <button type="submit" disabled={enviando || optimizando} className="boton-primario w-full">
        {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Agregar producto"}
      </button>
    </form>
  );
}
