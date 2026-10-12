"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";

const SEGUNDOS = 4;

/**
 * Banners de la portada (hasta 3) en carrusel. Siempre en proporción 4:1 y completos, del mismo
 * ancho que las tarjetas de productos, así se ven igual en celular, computadora y con cualquier zoom.
 */
export default function Banners({ banners, nombre }: { banners: string[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [quieto, setQuieto] = useState(false);
  const toque = useRef<number | null>(null);
  const varios = banners.length > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setQuieto(mq.matches);
  }, []);

  useEffect(() => {
    if (!varios || pausa || quieto) return;
    // Con la pestaña oculta no avanza; vuelve a contar desde el último cambio
    const t = setInterval(() => {
      if (!document.hidden) setActual((a) => (a + 1) % banners.length);
    }, SEGUNDOS * 1000);
    return () => clearInterval(t);
  }, [actual, pausa, quieto, varios, banners.length]);

  const ir = (i: number) => setActual((i + banners.length) % banners.length);

  return (
    <div
      className="banner-marco relative aspect-[4/1] w-full overflow-hidden rounded-xl bg-black/10 shadow-sm"
      aria-roledescription={varios ? "carrusel" : undefined}
      aria-label="Banners de la tienda"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onTouchStart={(e) => {
        setPausa(true);
        toque.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const inicio = toque.current;
        toque.current = null;
        setPausa(false);
        if (inicio === null || !varios) return;
        const dx = e.changedTouches[0].clientX - inicio;
        if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Fondo difuminado: rellena los lados si la imagen no viene en 4:1 */}
      {banners.map((src, i) => (
        <img
          key={"f" + src}
          src={src}
          alt=""
          aria-hidden
          className={`banner-capa absolute inset-0 h-full w-full scale-110 object-cover blur-2xl ${i === actual ? "opacity-60" : "opacity-0"}`}
        />
      ))}
      {banners.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? `Banner de ${nombre}` : ""}
          aria-hidden={i !== actual}
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`banner-capa banner-zoom absolute inset-0 h-full w-full object-contain ${i === actual ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {varios && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((src, i) => (
            <button
              key={"p" + src}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver banner ${i + 1}`}
              aria-current={i === actual}
              className={`h-2 rounded-full shadow transition-all ${i === actual ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/90"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
