"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { PublicidadPublica } from "@/lib/publicidad";
import { contar } from "@/lib/contar";

const SEGUNDOS = 6;

/** Publicidad pagada de otras tiendas: una a la vez, con la etiqueta "Publicidad". */
export default function Publicidad({ lista }: { lista: PublicidadPublica[] }) {
  const [orden, setOrden] = useState(lista);
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [visible, setVisible] = useState(false);
  const caja = useRef<HTMLElement>(null);
  const vistas = useRef(new Set<number>());

  // En otro orden en cada visita (después de cargar, para no romper la página del servidor)
  useEffect(() => {
    setOrden([...lista].sort(() => Math.random() - 0.5));
  }, [lista]);

  useEffect(() => {
    const el = caja.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisible(true);
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Cuenta una vista por publicidad cuando de verdad se vio
  const p = orden[actual];
  useEffect(() => {
    if (visible && p && !vistas.current.has(p.id)) {
      vistas.current.add(p.id);
      contar("vista", p.id);
    }
  }, [visible, p]);

  useEffect(() => {
    if (orden.length <= 1 || pausa || !visible) return;
    const t = setTimeout(() => setActual((i) => (i + 1) % orden.length), SEGUNDOS * 1000);
    return () => clearTimeout(t);
  }, [actual, orden.length, pausa, visible]);

  if (!p) return null;

  return (
    <section ref={caja} aria-label="Publicidad" className="mx-auto max-w-6xl px-4 pt-6" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
        <span className="absolute right-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Publicidad</span>
        <a
          key={p.id}
          href={p.enlace}
          target="_blank"
          rel="noopener sponsored"
          onClick={() => contar("clic", p.id)}
          className="publicidad-entrar grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        >
          <div className="relative aspect-video overflow-hidden bg-gray-100">
            <img src={p.imagen} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl" />
            <img src={p.imagen} alt={p.titulo} className="relative h-full w-full object-contain" loading="lazy" decoding="async" />
          </div>
          <div className="flex flex-col justify-center gap-1 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{p.anunciante}</p>
            <p className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">{p.titulo}</p>
            {p.texto && <p className="line-clamp-3 text-sm text-gray-600">{p.texto}</p>}
            <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white">
              {p.boton} <span aria-hidden>→</span>
            </span>
          </div>
        </a>
        {orden.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-3 sm:absolute sm:bottom-3 sm:right-4 sm:pb-0">
            {orden.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver publicidad ${i + 1}`}
                aria-current={i === actual}
                className={`h-2 rounded-full transition-all ${i === actual ? "w-5 bg-gray-800" : "w-2 bg-gray-300"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
