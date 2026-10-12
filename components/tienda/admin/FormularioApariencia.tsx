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

/** Una imagen de banner: ya guardada (url) o nueva (archivo optimizado, aún sin subir). */
type Img = { url?: string; archivo?: File; vista: string };
type Slot = { id: string; pc: Img; movil: Img | null };

const guardada = (url: string): Img => ({ url, vista: url });
const soltar = (i: Img | null) => i?.archivo && URL.revokeObjectURL(i.vista);

export default function FormularioApariencia({ tienda, sugeridos, accion }: Props) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const [principal, setPrincipal] = useState(tienda.color_principal);
  const [encabezado, setEncabezado] = useState(tienda.color_encabezado);
  const [titulo, setTitulo] = useState(tienda.titulo_portada);
  const [texto, setTexto] = useState(tienda.texto_portada);
  // Banners: cada uno con su imagen de computadora (4:1) y, opcional, la de celular (2:1)
  const [slots, setSlots] = useState<Slot[]>(() =>
    (tienda.banners_url?.length ? tienda.banners_url : tienda.banner_url ? [tienda.banner_url] : []).slice(0, MAX_BANNERS).map((u, i) => {
      const m = tienda.banners_movil_url?.[i];
      return { id: u, pc: guardada(u), movil: m ? guardada(m) : null };
    }),
  );
  const [optimizando, setOptimizando] = useState(false);
  const [portada, setPortada] = useState(tienda.color_portada ?? "");

  const colorValido = Boolean(normalizarColor(principal) && normalizarColor(encabezado) && (!portada || normalizarColor(portada)));
  const vars = colorValido ? variablesTema(principal, encabezado) : {};
  // La vista previa es de celular: muestra la imagen de celular del primero si la tiene
  const primero = slots[0];
  const fondo = primero ? (primero.movil ?? primero.pc).vista : null;
  const fondoMovil = Boolean(primero?.movil);

  async function optimizar(f: File, ancho: number): Promise<Img> {
    const o = await optimizarImagen(f, ancho);
    return { archivo: o, vista: URL.createObjectURL(o) };
  }

  async function agregar(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? []).slice(0, MAX_BANNERS - slots.length);
    e.target.value = "";
    if (!elegidos.length) return;
    setOptimizando(true);
    const listos: Slot[] = [];
    for (const f of elegidos) {
      const pc = await optimizar(f, 1600);
      listos.push({ id: pc.vista, pc, movil: null });
    }
    setSlots((l) => [...l, ...listos]);
    setOptimizando(false);
  }

  async function ponerMovil(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setOptimizando(true);
    const movil = await optimizar(f, 1200);
    setSlots((l) => l.map((x) => (x.id === id ? (soltar(x.movil), { ...x, movil }) : x)));
    setOptimizando(false);
  }

  function quitar(id: string) {
    setSlots((l) => {
      const x = l.find((y) => y.id === id);
      if (x) [x.pc, x.movil].forEach(soltar);
      return l.filter((y) => y.id !== id);
    });
  }

  function quitarMovil(id: string) {
    setSlots((l) => l.map((x) => (x.id === id ? (soltar(x.movil), { ...x, movil: null }) : x)));
  }

  return (
    <form
      // Se envía a mano para agregar los banners nuevos y que el formulario no se borre si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        // Los archivos nuevos van en "banners_archivos"; el plan dice cuál va en cada banner
        const archivos: File[] = [];
        const ref = (i: Img | null) => {
          if (!i) return null;
          if (i.url) return { url: i.url };
          archivos.push(i.archivo!);
          return { nuevo: archivos.length - 1 };
        };
        const plan = slots.map((x) => ({ pc: ref(x.pc), movil: ref(x.movil) }));
        datos.set("banners_plan", JSON.stringify(plan));
        archivos.forEach((a) => datos.append("banners_archivos", a));
        startTransition(() => enviar(datos));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-5">
        <SelectorColor nombre="color_principal" titulo="Color principal (botones y enlaces)" valor={principal} muestras={MUESTRAS} cambiar={setPrincipal} />
        <SelectorColor nombre="color_encabezado" titulo="Color de la barra de arriba" valor={encabezado} muestras={MUESTRAS_ENCABEZADO} cambiar={setEncabezado} />

        <div className="space-y-2">
          <span className="text-sm font-medium">Banners de la portada (hasta {MAX_BANNERS})</span>
          <div className="space-y-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
            <p>
              <b>Computadora: 1600 × 400 píxeles</b> (4 veces más ancho que alto).
            </p>
            <p>
              <b>Celular (opcional): 1200 × 600 píxeles</b> (el doble de ancho que de alto). Haz una versión con letras más grandes para
              que se lea bien en el teléfono; si no la subes, en el celular se ve la de computadora.
            </p>
            <p>Siempre se ven completos, con cualquier pantalla o zoom. Con varios banners, pasan solos cada 4 segundos.</p>
          </div>
          <div className="space-y-2">
            {slots.map((x, i) => (
              <div key={x.id} className="grid grid-cols-[2fr_1fr] items-start gap-2 rounded-lg border bg-white p-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-gray-600">Banner {i + 1} · Computadora</span>
                  <div className="relative aspect-[4/1] overflow-hidden rounded-md border bg-gray-100">
                    <img src={x.pc.vista} alt={`Banner ${i + 1}`} className="h-full w-full object-contain" />
                    {x.pc.archivo && <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] text-white">Nuevo</span>}
                    <button type="button" onClick={() => quitar(x.id)} aria-label={`Quitar banner ${i + 1}`} className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs font-bold text-white">
                      ×
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-gray-600">Celular</span>
                  {x.movil ? (
                    <div className="relative aspect-[2/1] overflow-hidden rounded-md border bg-gray-100">
                      <img src={x.movil.vista} alt={`Banner ${i + 1} para celular`} className="h-full w-full object-contain" />
                      {x.movil.archivo && <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] text-white">Nuevo</span>}
                      <button type="button" onClick={() => quitarMovil(x.id)} aria-label={`Quitar imagen de celular del banner ${i + 1}`} className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs font-bold text-white">
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="grid aspect-[2/1] cursor-pointer place-items-center rounded-md border-2 border-dashed border-gray-300 px-1 text-center text-[11px] leading-tight text-gray-600 hover:border-marca-400">
                      {optimizando ? "Optimizando…" : "+ Imagen para celular"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        aria-label={`Imagen para celular del banner ${i + 1}`}
                        onChange={(e) => ponerMovil(x.id, e)}
                        disabled={optimizando}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
            {slots.length < MAX_BANNERS && (
              <label className="grid h-14 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-600 hover:border-marca-400">
                {optimizando ? "Optimizando…" : `+ Agregar banner (${slots.length}/${MAX_BANNERS})`}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" onChange={agregar} disabled={optimizando} />
              </label>
            )}
          </div>
          {slots.length === 0 && <p className="text-xs text-gray-500">Sin banner, la portada usa el color de la barra.</p>}
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
                <div className={`relative overflow-hidden rounded-md bg-black/10 ${fondoMovil ? "aspect-[2/1]" : "aspect-[4/1]"}`}>
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
