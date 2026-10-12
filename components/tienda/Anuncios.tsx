"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { idYoutube } from "@/lib/anunciosConfig";
import type { AnuncioPublico } from "@/lib/anuncios";

const SEGUNDOS = 5;

/** Carrusel de anuncios (sorteos, regalías, promociones) debajo de la portada de la tienda. */
/** `origen` completa el mensaje de WhatsApp: "Lo vi en la tienda Ferretería El Sol". */
export default function Anuncios({ anuncios, whatsapp, origen }: { anuncios: AnuncioPublico[]; whatsapp: string; origen: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [foto, setFoto] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [quieto, setQuieto] = useState(false); // Usuario que pidió menos movimiento
  const [videoAbierto, setVideoAbierto] = useState<number | null>(null);
  const [vuelta, setVuelta] = useState(0); // Vuelve a contar si la pestaña estaba oculta

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(mq.matches);
    const cambio = () => setQuieto(mq.matches);
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, []);

  const irA = useCallback(
    (i: number) => {
      const el = pista.current;
      if (!el) return;
      const n = (i + anuncios.length) % anuncios.length;
      el.scrollTo({ left: n * el.clientWidth, behavior: quieto ? "auto" : "smooth" });
    },
    [anuncios.length, quieto],
  );

  // Avance automático: primero las imágenes del anuncio, luego el siguiente anuncio
  useEffect(() => {
    if (quieto || pausa || videoAbierto !== null) return;
    const total = anuncios[actual]?.imagenes.length ?? 0;
    if (total <= 1 && anuncios.length <= 1) return;
    const t = setTimeout(() => {
      if (document.hidden) return setVuelta((v) => v + 1); // Pestaña oculta: espera
      if (foto + 1 < total) setFoto(foto + 1);
      else if (anuncios.length > 1) irA(actual + 1);
      else setFoto(0);
    }, SEGUNDOS * 1000);
    return () => clearTimeout(t);
  }, [actual, foto, pausa, quieto, videoAbierto, anuncios, irA, vuelta]);

  function alDeslizar() {
    const el = pista.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== actual) {
      setActual(i);
      setFoto(0);
      setVideoAbierto(null);
    }
  }

  async function compartir(a: AnuncioPublico) {
    const url = window.location.origin + window.location.pathname;
    const texto = `🎉 ${a.titulo}${a.texto ? "\n" + a.texto.slice(0, 200) : ""}\n\nMíralo aquí:`;
    if (navigator.share) {
      try {
        await navigator.share({ title: a.titulo, text: texto, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, "_blank", "noopener");
  }

  function enlaceParticipar(a: AnuncioPublico) {
    if (a.boton_url) return a.boton_url;
    if (!whatsapp) return "";
    const texto = `Hola, quiero participar en "${a.titulo}". Lo vi en ${origen}.`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  if (anuncios.length === 0) return null;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Anuncios"
      className="mx-auto max-w-6xl px-4 pt-6"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocusCapture={() => setPausa(true)}
      onBlurCapture={() => setPausa(false)}
      onTouchStart={() => setPausa(true)}
      onTouchEnd={() => setPausa(false)}
    >
      <div className="anuncio-borde rounded-2xl p-[3px] shadow-lg">
        <div className="relative overflow-hidden rounded-[13px] bg-white">
          <div ref={pista} onScroll={alDeslizar} className="anuncio-pista flex snap-x snap-mandatory overflow-x-auto">
            {anuncios.map((a, i) => {
              const yt = a.video_url ? idYoutube(a.video_url) : null;
              const participar = a.boton_texto ? enlaceParticipar(a) : "";
              const fotoVisible = i === actual ? foto : 0;
              return (
                <article
                  key={a.id}
                  aria-roledescription="anuncio"
                  aria-label={`${i + 1} de ${anuncios.length}: ${a.titulo}`}
                  className="grid w-full shrink-0 snap-center md:grid-cols-5"
                >
                  {/* Imagen o video, siempre en 16:9 para que se ajuste a cualquier pantalla */}
                  <div className="relative aspect-video overflow-hidden bg-gray-900 md:col-span-3">
                    {a.imagenes.map((src, j) => (
                      <div key={src} className={`anuncio-imagen absolute inset-0 ${j === fotoVisible ? "opacity-100" : "opacity-0"}`} aria-hidden={j !== fotoVisible}>
                        {/* Fondo difuminado: si la imagen no es 16:9 no se corta ni quedan franjas negras */}
                        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl" loading={i === 0 && j === 0 ? "eager" : "lazy"} />
                        <img src={src} alt={j === 0 ? a.titulo : ""} className="relative h-full w-full object-contain" loading={i === 0 && j === 0 ? "eager" : "lazy"} decoding="async" />
                      </div>
                    ))}
                    {a.imagenes.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {a.imagenes.map((src, j) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => { setActual(i); setFoto(j); }}
                            aria-label={`Imagen ${j + 1}`}
                            className={`h-2 rounded-full shadow transition-all ${j === fotoVisible ? "w-5 bg-white" : "w-2 bg-white/60"}`}
                          />
                        ))}
                      </div>
                    )}
                    {a.video_url && yt && videoAbierto === a.id && (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
                        title={a.titulo}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    )}
                    {a.video_url && yt && videoAbierto !== a.id && (
                      // La miniatura carga rápido; el reproductor de YouTube solo se abre al tocar
                      <button type="button" onClick={() => setVideoAbierto(a.id)} className="group absolute inset-0" aria-label={`Ver video: ${a.titulo}`}>
                        <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                        <span className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/10">
                          <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-xl transition group-hover:scale-110">
                            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                          </span>
                        </span>
                      </button>
                    )}
                    {a.video_url && !yt && (
                      <a href={a.video_url} target="_blank" rel="noopener noreferrer" className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 text-white">
                        <span className="flex flex-col items-center gap-3">
                          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/25 shadow-xl transition group-hover:scale-110">
                            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                          </span>
                          <span className="text-lg font-bold">Ver video</span>
                        </span>
                      </a>
                    )}
                    <span className="anuncio-insignia absolute left-3 top-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                      🎉 ¡No te lo pierdas!
                    </span>
                  </div>

                  {/* Texto y botones */}
                  <div className="flex flex-col justify-center gap-3 p-4 sm:p-6 md:col-span-2">
                    <h2 className="text-xl font-black leading-tight text-gray-900 sm:text-2xl">{a.titulo}</h2>
                    {a.texto && <p className="whitespace-pre-line text-sm text-gray-700 sm:text-base">{a.texto}</p>}
                    <div className="mt-1 flex flex-wrap gap-2">
                      {participar && (
                        <a
                          href={participar}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-bold text-white shadow hover:bg-green-700"
                        >
                          {a.boton_texto}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => compartir(a)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                          <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                        </svg>
                        Compartir
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {anuncios.length > 1 && (
            <>
              <button type="button" onClick={() => irA(actual - 1)} aria-label="Anuncio anterior" className="absolute left-2 top-[28%] hidden h-10 w-10 place-items-center rounded-full bg-white/90 text-xl font-bold shadow md:top-1/2 md:grid md:-translate-y-1/2">
                ‹
              </button>
              <button type="button" onClick={() => irA(actual + 1)} aria-label="Anuncio siguiente" className="absolute right-2 top-[28%] hidden h-10 w-10 place-items-center rounded-full bg-white/90 text-xl font-bold shadow md:top-1/2 md:grid md:-translate-y-1/2">
                ›
              </button>
              <div className="flex justify-center gap-2 pb-3">
                {anuncios.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => irA(i)}
                    aria-label={`Ver anuncio ${i + 1}`}
                    aria-current={i === actual}
                    className={`h-2.5 rounded-full transition-all ${i === actual ? "w-7 bg-orange-500" : "w-2.5 bg-gray-300"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
