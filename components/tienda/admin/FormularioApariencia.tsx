"use client";

/* eslint-disable @next/next/no-img-element */
import { startTransition, useActionState, useState } from "react";
import type { Resultado } from "@/app/acciones-tienda";
import { optimizarImagen } from "@/lib/optimizarImagen";
import { MUESTRAS, MUESTRAS_ENCABEZADO, MUESTRAS_PORTADA, estiloPortada, normalizarColor, variablesTema } from "@/lib/tema";
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

const MAX_BANNERS = 3;

export default function FormularioApariencia({ tienda, sugeridos, accion }: Props) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const [principal, setPrincipal] = useState(tienda.color_principal);
  const [encabezado, setEncabezado] = useState(tienda.color_encabezado);
  const [titulo, setTitulo] = useState(tienda.titulo_portada);
  const [texto, setTexto] = useState(tienda.texto_portada);
  // Banners: los que ya tiene (se pueden quitar) y los nuevos, ya optimizados
  const [guardados, setGuardados] = useState<string[]>(
    tienda.banners_url?.length ? tienda.banners_url : tienda.banner_url ? [tienda.banner_url] : [],
  );
  const [nuevos, setNuevos] = useState<{ archivo: File; vista: string }[]>([]);
  const [optimizando, setOptimizando] = useState(false);
  const [portada, setPortada] = useState(tienda.color_portada ?? "");
  const totalBanners = guardados.length + nuevos.length;

  const colorValido = Boolean(normalizarColor(principal) && normalizarColor(encabezado) && (!portada || normalizarColor(portada)));
  const vars = colorValido ? variablesTema(principal, encabezado) : {};
  const fondo = guardados[0] ?? nuevos[0]?.vista ?? null;

  async function agregar(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? []).slice(0, MAX_BANNERS - totalBanners);
    e.target.value = "";
    if (!elegidos.length) return;
    setOptimizando(true);
    const listos: { archivo: File; vista: string }[] = [];
    for (const f of elegidos) {
      const o = await optimizarImagen(f, 1600);
      listos.push({ archivo: o, vista: URL.createObjectURL(o) });
    }
    setNuevos((n) => [...n, ...listos]);
    setOptimizando(false);
  }

  return (
    <form
      // Se envía a mano para agregar los banners nuevos y que el formulario no se borre si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        nuevos.forEach((n) => datos.append("banners_nuevos", n.archivo));
        startTransition(() => enviar(datos));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-5">
        <SelectorColor nombre="color_principal" titulo="Color principal (botones y enlaces)" valor={principal} muestras={MUESTRAS} cambiar={setPrincipal} />
        <SelectorColor nombre="color_encabezado" titulo="Color de la barra de arriba" valor={encabezado} muestras={MUESTRAS_ENCABEZADO} cambiar={setEncabezado} />

        <div className="space-y-2">
          <span className="text-sm font-medium">Banners de la portada (hasta {MAX_BANNERS})</span>
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
            <b>Medida recomendada: 1600 × 400 píxeles</b> (horizontal, 4 veces más ancho que alto). Se ven completos en celular,
            computadora y con cualquier zoom; si la imagen tiene otra medida no se corta. Con varios banners, pasan solos cada 4 segundos.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {guardados.map((src, i) => (
              <div key={src} className="relative aspect-[4/1] overflow-hidden rounded-lg border bg-gray-100">
                <input type="hidden" name="banners_conservar" value={src} />
                <img src={src} alt={`Banner ${i + 1}`} className="h-full w-full object-contain" />
                <button type="button" onClick={() => setGuardados((g) => g.filter((x) => x !== src))} aria-label="Quitar banner" className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs font-bold text-white">
                  ×
                </button>
              </div>
            ))}
            {nuevos.map((n, i) => (
              <div key={n.vista} className="relative aspect-[4/1] overflow-hidden rounded-lg border bg-gray-100">
                <img src={n.vista} alt="" className="h-full w-full object-contain" />
                <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] text-white">Nuevo</span>
                <button
                  type="button"
                  onClick={() =>
                    setNuevos((l) => {
                      URL.revokeObjectURL(l[i].vista);
                      return l.filter((_, j) => j !== i);
                    })
                  }
                  aria-label="Quitar banner"
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {totalBanners < MAX_BANNERS && (
              <label className="grid aspect-[4/1] cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-600 hover:border-marca-400">
                {optimizando ? "Optimizando…" : `+ Agregar banner (${totalBanners}/${MAX_BANNERS})`}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={agregar} disabled={optimizando} />
              </label>
            )}
          </div>
          {totalBanners === 0 && <p className="text-xs text-gray-500">Sin banner, la portada usa el color de la barra.</p>}
        </div>

        <SelectorColor
          nombre="color_portada"
          titulo="Color de fondo del título y texto de la portada"
          valor={portada || encabezado}
          muestras={MUESTRAS_PORTADA}
          cambiar={setPortada}
        />

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
          <div className="relative bg-encabezado text-encabezado-texto" style={estiloPortada(portada)}>
            {fondo && (
              <div className="px-3 pt-3">
                <div className="relative aspect-[4/1] overflow-hidden rounded-md bg-black/10">
                  <img src={fondo} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" />
                  <img src={fondo} alt="" className="relative h-full w-full object-contain" />
                </div>
              </div>
            )}
            <div className={`relative px-3 ${fondo ? "pb-3 pt-2" : "py-5"}`}>
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
