"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useState } from "react";
import type { Resultado } from "@/app/acciones-tienda";
import { optimizarCampo } from "@/lib/optimizarImagen";
import { MUESTRAS, MUESTRAS_ENCABEZADO, normalizarColor, variablesTema } from "@/lib/tema";
import type { FilaTienda } from "@/lib/tienda/types";

type Props = {
  tienda: FilaTienda;
  /** Textos que se usan si el dueño deja los suyos vacíos (los de su tipo de negocio). */
  sugeridos: { titulo: string; texto: string; buscador: string };
  accion: (prev: Resultado, fd: FormData) => Promise<Resultado>;
};

function SelectorColor({
  nombre,
  titulo,
  valor,
  muestras,
  cambiar,
}: {
  nombre: string;
  titulo: string;
  valor: string;
  muestras: { nombre: string; hex: string }[];
  cambiar: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {muestras.map((m) => (
          <button
            key={m.hex}
            type="button"
            onClick={() => cambiar(m.hex)}
            title={m.nombre}
            aria-label={m.nombre}
            aria-pressed={valor === m.hex}
            className={`h-8 w-8 rounded-full border-2 shadow-sm transition ${valor === m.hex ? "scale-110 border-gray-900" : "border-white ring-1 ring-gray-300"}`}
            style={{ backgroundColor: m.hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={valor} onChange={(e) => cambiar(e.target.value)} className="h-9 w-12 cursor-pointer rounded border bg-white p-0.5" aria-label={`${titulo}: elegir otro`} />
        <input
          name={nombre}
          value={valor}
          onChange={(e) => cambiar(e.target.value.toLowerCase())}
          onBlur={(e) => cambiar(normalizarColor(e.target.value) || valor)}
          maxLength={7}
          className="campo w-28 font-mono"
          aria-label={`${titulo} en código`}
        />
        <span className="text-xs text-gray-500">o elige cualquier otro</span>
      </div>
    </fieldset>
  );
}

export default function FormularioApariencia({ tienda, sugeridos, accion }: Props) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const [principal, setPrincipal] = useState(tienda.color_principal);
  const [encabezado, setEncabezado] = useState(tienda.color_encabezado);
  const [titulo, setTitulo] = useState(tienda.titulo_portada);
  const [texto, setTexto] = useState(tienda.texto_portada);
  const [banner, setBanner] = useState<string | null>(tienda.banner_url);
  const [quitar, setQuitar] = useState(false);
  const [optimizando, setOptimizando] = useState(false);

  const colorValido = Boolean(normalizarColor(principal) && normalizarColor(encabezado));
  const vars = colorValido ? variablesTema(principal, encabezado) : {};
  const fondo = banner && !quitar ? banner : null;

  return (
    <form action={enviar} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <SelectorColor nombre="color_principal" titulo="Color principal (botones y enlaces)" valor={principal} muestras={MUESTRAS} cambiar={setPrincipal} />
        <SelectorColor nombre="color_encabezado" titulo="Color de la barra de arriba" valor={encabezado} muestras={MUESTRAS_ENCABEZADO} cambiar={setEncabezado} />

        <div className="space-y-1">
          <span className="text-sm font-medium">Banner de la portada</span>
          <input
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={async (e) => {
              const input = e.currentTarget;
              if (!input.files?.[0]) {
                setBanner(tienda.banner_url);
                return;
              }
              setOptimizando(true);
              const f = await optimizarCampo(input, 1600);
              setOptimizando(false);
              setBanner(f ? URL.createObjectURL(f) : tienda.banner_url);
              if (f) setQuitar(false);
            }}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-marca-50 file:px-3 file:py-2 file:font-semibold file:text-marca-700 hover:file:bg-marca-100"
          />
          {tienda.banner_url && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" name="quitar_banner" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} />
              Quitar el banner actual (se usa el color de la barra)
            </label>
          )}
          <p className="text-xs text-gray-500">
            {optimizando ? "Optimizando imagen…" : "Medida recomendada: 1600 × 600 píxeles (horizontal). Se ve completa en celular y computadora, con cualquier zoom; si tiene otra medida no se corta. El título y el texto van debajo del banner. Se optimiza sola antes de subirse."}
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Título de la portada</span>
          <input name="titulo_portada" maxLength={80} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={sugeridos.titulo} className="campo" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Texto de la portada</span>
          <textarea name="texto_portada" rows={2} maxLength={200} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={sugeridos.texto} className="campo" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Ejemplo en el buscador</span>
          <input name="texto_buscador" maxLength={60} defaultValue={tienda.texto_buscador} placeholder={sugeridos.buscador} className="campo" />
          <span className="block text-xs text-gray-500">Si dejas un campo vacío, se usa el texto gris de ejemplo.</span>
        </label>

        {resultado && (
          <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {resultado.mensaje}
          </p>
        )}
        <button type="submit" disabled={enviando || optimizando || !colorValido} className="boton-primario w-full">
          {enviando ? "Guardando…" : "Guardar apariencia"}
        </button>
      </div>

      {/* Vista previa */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-sm font-medium">Vista previa</p>
        <div className="overflow-hidden rounded-xl border shadow-sm" style={vars}>
          <div className="flex items-center justify-between bg-encabezado px-3 py-2 text-encabezado-texto">
            <span className="flex items-center gap-2 text-sm font-bold">
              {tienda.logo_url ? (
                <img src={tienda.logo_url} alt="" className="h-6 max-w-[60px] rounded object-contain" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded bg-marca-500 text-xs text-white">{tienda.nombre_tienda.charAt(0)}</span>
              )}
              <span className="line-clamp-1">{tienda.nombre_tienda}</span>
            </span>
            <span className="rounded bg-encabezado-texto/10 px-2 py-0.5 text-xs">Mi pedido</span>
          </div>
          {fondo && (
            <div className="relative aspect-[8/3] overflow-hidden bg-encabezado">
              <img src={fondo} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
              <img src={fondo} alt="" className="relative h-full w-full object-contain" />
            </div>
          )}
          <div className="relative bg-encabezado text-encabezado-texto">
            <div className={`relative px-3 ${fondo ? "py-3" : "py-5"}`}>
              <p className="text-base font-bold leading-tight">{titulo || sugeridos.titulo}</p>
              <p className="mt-1 text-xs opacity-90">{texto || sugeridos.texto}</p>
            </div>
          </div>
          <div className="space-y-2 bg-gray-50 p-3">
            <div className="flex gap-1.5">
              <span className="rounded-full bg-marca-600 px-2 py-0.5 text-[11px] text-white">Todas</span>
              <span className="rounded-full border bg-white px-2 py-0.5 text-[11px]">Categoría</span>
            </div>
            <div className="rounded-lg border bg-white p-2">
              <div className="mb-2 h-12 rounded bg-gray-200" />
              <span className="block rounded-md bg-marca-600 py-1 text-center text-[11px] font-semibold text-white">Agregar al carrito</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
