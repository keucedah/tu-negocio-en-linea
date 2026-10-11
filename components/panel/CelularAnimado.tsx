"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

// Pantallas que pasan solas dentro del teléfono de la portada (capturas reales de una tienda).
const PANTALLAS = [
  { src: "/capturas/tienda.webp", alt: "Catálogo de una tienda en el celular" },
  { src: "/capturas/mas-vendido.webp", alt: "Carrusel de lo más vendido" },
  { src: "/capturas/pedido.webp", alt: "Pedido listo para enviar por WhatsApp" },
];
const SEGUNDOS = 3.5;

/** Teléfono de la portada: muestra la tienda funcionando y avisa cuando "llega" un pedido. */
export default function CelularAnimado() {
  const [actual, setActual] = useState(0);
  const [quieto, setQuieto] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setQuieto(false);
    const t = setInterval(() => setActual((n) => (n + 1) % PANTALLAS.length), SEGUNDOS * 1000);
    return () => clearInterval(t);
  }, []);

  const pedido = actual === PANTALLAS.length - 1;

  return (
    <div className={`relative mx-auto w-full max-w-[260px] ${quieto ? "" : "celular-flota"}`}>
      <div className="relative rounded-[2.2rem] bg-gray-900 p-2.5 shadow-2xl ring-1 ring-white/10">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-gray-900" />
        <div className="relative aspect-[9/17] overflow-hidden rounded-[1.7rem] bg-[#111827] pt-3">
          {PANTALLAS.map((p, i) => (
            <img
              key={p.src}
              src={p.src}
              alt={i === actual ? p.alt : ""}
              aria-hidden={i !== actual}
              width={576}
              height={1076}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              className={`absolute inset-0 top-3 h-[calc(100%-0.75rem)] w-full object-cover object-top transition-all duration-700 ease-out ${
                i === actual ? "translate-x-0 opacity-100" : i === (actual + PANTALLAS.length - 1) % PANTALLAS.length ? "-translate-x-1/4 opacity-0" : "translate-x-1/4 opacity-0"
              }`}
            />
          ))}
          {/* Puntos que marcan la pantalla */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {PANTALLAS.map((p, i) => (
              <span key={p.src} className={`h-1.5 rounded-full bg-white/80 shadow transition-all duration-500 ${i === actual ? "w-4" : "w-1.5 opacity-60"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Aviso de pedido que aparece junto al teléfono */}
      <div
        className={`absolute -right-4 top-1/3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-left text-gray-900 shadow-xl ring-1 ring-black/5 transition-all duration-500 sm:-right-16 ${
          pedido && !quieto ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-90 opacity-0"
        }`}
        aria-hidden={!pedido}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        <span className="leading-tight">
          <span className="block text-xs text-gray-500">WhatsApp</span>
          <span className="block text-sm font-bold">¡Nuevo pedido!</span>
        </span>
      </div>
    </div>
  );
}
