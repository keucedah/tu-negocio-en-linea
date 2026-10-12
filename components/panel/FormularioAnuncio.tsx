"use client";
/* eslint-disable @next/next/no-img-element */

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarAnuncio } from "@/app/admin/acciones-anuncios";
import { LADO_ANUNCIO, MAX_IMAGENES_ANUNCIO, MEDIDA_RECOMENDADA, idYoutube } from "@/lib/anunciosConfig";
import { formatoPeso, optimizarImagen } from "@/lib/optimizarImagen";
import type { Anuncio } from "@/lib/panel/types";

type Nueva = { archivo: File; vista: string };

export default function FormularioAnuncio({ anuncio, tiendas }: { anuncio?: Anuncio; tiendas: { id: number; nombre: string; activa: boolean }[] }) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(guardarAnuncio, null);
  const form = useRef<HTMLFormElement>(null);
  const [tipo, setTipo] = useState<"imagenes" | "video">(anuncio?.video_url ? "video" : "imagenes");
  const [conservadas, setConservadas] = useState<string[]>(anuncio?.imagenes ?? []);
  const [nuevas, setNuevas] = useState<Nueva[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [avisoFotos, setAvisoFotos] = useState("");
  const [donde, setDonde] = useState<"todas" | "elegidas">(anuncio?.tiendas.length ? "elegidas" : "todas");
  const [video, setVideo] = useState(anuncio?.video_url ?? "");

  const total = conservadas.length + nuevas.length;

  useEffect(() => {
    if (!resultado?.ok) return;
    if (anuncio) {
      router.push("/admin/anuncios");
    } else {
      form.current?.reset();
      nuevas.forEach((n) => URL.revokeObjectURL(n.vista));
      setNuevas([]);
      setConservadas([]);
      setVideo("");
      setDonde("todas");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado]);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const elegidas = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!elegidas.length) return;
    const espacio = MAX_IMAGENES_ANUNCIO - total;
    setAvisoFotos(elegidas.length > espacio ? `Solo caben ${MAX_IMAGENES_ANUNCIO} imágenes; se tomaron las primeras ${Math.max(0, espacio)}.` : "");
    setPreparando(true);
    const listas: Nueva[] = [];
    for (const archivo of elegidas.slice(0, Math.max(0, espacio))) {
      if (!archivo.type.startsWith("image/")) continue;
      const optimizada = await optimizarImagen(archivo, LADO_ANUNCIO);
      listas.push({ archivo: optimizada, vista: URL.createObjectURL(optimizada) });
    }
    setNuevas((n) => [...n, ...listas]);
    setPreparando(false);
  }

  function quitarNueva(i: number) {
    setNuevas((n) => {
      URL.revokeObjectURL(n[i].vista);
      return n.filter((_, j) => j !== i);
    });
  }

  const yt = video ? idYoutube(video) : null;

  return (
    <form
      ref={form}
      // Se envía a mano para que el formulario no se borre si hay un error
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        datos.delete("nuevas");
        nuevas.forEach((n) => datos.append("nuevas", n.archivo));
        startTransition(() => enviar(datos));
      }}
      className="space-y-4"
    >
      {anuncio && <input type="hidden" name="id" value={anuncio.id} />}

      <label className="block">
        <span className="etiqueta">Título *</span>
        <input name="titulo" required maxLength={80} defaultValue={anuncio?.titulo} className="campo" placeholder="Gran sorteo de aniversario" />
      </label>
      <label className="block">
        <span className="etiqueta">Texto del anuncio</span>
        <textarea name="texto" rows={4} maxLength={1000} defaultValue={anuncio?.texto} className="campo" placeholder="Participa y gana una canasta de productos. El ganador se anuncia el 30 de octubre." />
      </label>

      <fieldset>
        <legend className="etiqueta">¿Qué lleva el anuncio?</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="imagenes" checked={tipo === "imagenes"} onChange={() => setTipo("imagenes")} /> Imágenes (hasta {MAX_IMAGENES_ANUNCIO})
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="tipo" value="video" checked={tipo === "video"} onChange={() => setTipo("video")} /> Un video por enlace
          </label>
        </div>
      </fieldset>

      {tipo === "imagenes" ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900">
            <p className="font-semibold">Medida recomendada: {MEDIDA_RECOMENDADA}</p>
            <p>
              El anuncio se ajusta solo al ancho del celular, la tableta o la computadora. Pon el texto importante en el centro de la imagen.
              Si la imagen tiene otra medida no se corta: se ve completa sobre un fondo difuminado. Todas se guardan en WebP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {conservadas.map((src) => (
              <div key={src} className="relative aspect-video overflow-hidden rounded-lg border bg-gray-100">
                <input type="hidden" name="conservar" value={src} />
                <img src={src} alt="" className="h-full w-full object-contain" />
                <button type="button" onClick={() => setConservadas((c) => c.filter((x) => x !== src))} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-sm font-bold text-white" aria-label="Quitar imagen">
                  ×
                </button>
              </div>
            ))}
            {nuevas.map((n, i) => (
              <div key={n.vista} className="relative aspect-video overflow-hidden rounded-lg border bg-gray-100">
                <img src={n.vista} alt="" className="h-full w-full object-contain" />
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">{n.archivo.type === "image/webp" ? "WebP" : "Se pasa a WebP"} · {formatoPeso(n.archivo.size)}</span>
                <button type="button" onClick={() => quitarNueva(i)} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 text-sm font-bold text-white" aria-label="Quitar imagen">
                  ×
                </button>
              </div>
            ))}
            {total < MAX_IMAGENES_ANUNCIO && (
              <label className="grid aspect-video cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-600 hover:border-orange-400 hover:text-orange-700">
                <span>{preparando ? "Preparando…" : `+ Agregar imagen (${total}/${MAX_IMAGENES_ANUNCIO})`}</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={elegir} disabled={preparando} />
              </label>
            )}
          </div>
          {avisoFotos && <p className="text-xs text-amber-700">{avisoFotos}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block">
            <span className="etiqueta">Enlace del video *</span>
            <input name="video_url" type="url" required maxLength={300} value={video} onChange={(e) => setVideo(e.target.value)} className="campo" placeholder="https://youtu.be/..." />
          </label>
          <p className="text-xs text-gray-600">
            Los videos de YouTube se ven dentro del anuncio. De Facebook, TikTok u otros sale un botón “Ver video” que lo abre.
          </p>
          {yt && <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="Vista previa del video" className="aspect-video w-full max-w-xs rounded-lg object-cover" />}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Texto del botón</span>
          <input name="boton_texto" maxLength={30} defaultValue={anuncio ? anuncio.boton_texto : "Quiero participar"} className="campo" />
          <span className="mt-1 block text-xs text-gray-500">Déjalo vacío si no quieres botón.</span>
        </label>
        <label className="block">
          <span className="etiqueta">Enlace del botón (opcional)</span>
          <input name="boton_url" type="url" maxLength={300} defaultValue={anuncio?.boton_url} className="campo" placeholder="Vacío = abre tu WhatsApp" />
          <span className="mt-1 block text-xs text-gray-500">Si lo dejas vacío, abre tu WhatsApp con el nombre del anuncio y de la tienda.</span>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="etiqueta">¿En qué tiendas sale?</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="donde" value="todas" checked={donde === "todas"} onChange={() => setDonde("todas")} /> Todas las tiendas
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="donde" value="elegidas" checked={donde === "elegidas"} onChange={() => setDonde("elegidas")} /> Solo las que elija
          </label>
        </div>
        {donde === "elegidas" && (
          <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-2 text-sm sm:grid-cols-2">
            {tiendas.length === 0 && <p className="text-gray-500">Todavía no hay tiendas.</p>}
            {tiendas.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input type="checkbox" name="tiendas" value={t.id} defaultChecked={anuncio?.tiendas.includes(t.id)} className="h-4 w-4" />
                {t.nombre}
                {!t.activa && <span className="text-xs text-gray-400">(suspendida)</span>}
              </label>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="en_inicio" defaultChecked={anuncio?.en_inicio ?? true} className="h-4 w-4" />
          Mostrar también en mi página principal
        </label>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="etiqueta">Empieza</span>
          <input name="inicia" type="date" defaultValue={anuncio?.inicia ?? ""} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Termina</span>
          <input name="termina" type="date" defaultValue={anuncio?.termina ?? ""} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Orden</span>
          <input name="orden" type="number" defaultValue={anuncio?.orden ?? 0} className="campo" />
        </label>
      </div>
      <p className="-mt-2 text-xs text-gray-500">Sin fechas sale desde hoy y hasta que lo pauses. El último día de “Termina” todavía se ve; al día siguiente desaparece solo.</p>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={anuncio?.activo ?? true} className="h-4 w-4" />
        Activo (se muestra en las tiendas)
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={enviando || preparando} className="boton-primario">
          {enviando ? "Guardando…" : anuncio ? "Guardar cambios" : "Publicar anuncio"}
        </button>
        {anuncio && (
          <button type="button" onClick={() => router.push("/admin/anuncios")} className="boton-secundario">
            Cancelar
          </button>
        )}
      </div>
      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{resultado.mensaje}</p>
      )}
    </form>
  );
}
