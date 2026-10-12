"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { BannerTienda } from "@/lib/tienda/types";

const SEGUNDOS = 4;
/** Hasta este ancho de pantalla (celulares en vertical) se usa la imagen para celular. Igual que "sm" de Tailwind. */
const CELULAR = "(max-width: 639px)";

/** La imagen de celular si la hay y la pantalla es angosta; si no, la de computadora. El navegador baja solo una. */
function Imagen({ b, alt, className, ...resto }: { b: BannerTienda; alt: string; className: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <picture>
      {b.movil && <source media={CELULAR} srcSet={b.movil} />}
      <img src={b.pc} alt={alt} className={className} {...resto} />
    </picture>
  );
}

/**
 * Banners de la portada (hasta 3) en carrusel, del mismo ancho que las tarjetas de productos y siempre completos.
 * En computadora miden 4:1. En celular miden 2:1 si algún banner tiene imagen para celular; si no, 4:1.
 */
export default function Banners({ banners, nombre }: { banners: BannerTienda[]; nombre: string }) {
  const [actual, setActual] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [quieto, setQuieto] = useState(false);
  const toque = useRef<number | null>(null);
  const varios = banners.length > 1;
  const conMovil = banners.some((b) => b.movil);

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
      className={`banner-marco relative w-full ${conMovil ? "aspect-[2/1] sm:aspect-[4/1]" : "aspect-[4/1]"} overflow-hidden rounded-xl bg-black/10 shadow-sm`}
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
      {banners.map((b, i) => (
        <Imagen
          key={"f" + b.pc}
          b={b}
          alt=""
          aria-hidden
          className={`banner-capa absolute inset-0 h-full w-full scale-110 object-cover blur-2xl ${i === actual ? "opacity-60" : "opacity-0"}`}
        />
      ))}
      {banners.map((b, i) => (
        <Imagen
          key={b.pc}
          b={b}
          alt={i === 0 ? `Banner de ${nombre}` : ""}
          aria-hidden={i !== actual}
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`banner-capa banner-zoom absolute inset-0 h-full w-full object-contain ${i === actual ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {varios && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={"p" + b.pc}
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
