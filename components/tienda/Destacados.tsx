"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/lib/tienda/types";
import ImagenProducto from "./ImagenProducto";
import BotonAgregar from "./BotonAgregar";
import { useBase } from "./BaseTienda";
import EtiquetaNuevo from "./EtiquetaNuevo";

const SEGUNDOS = 5;

/** Carrusel de los productos más vendidos que marcó el dueño. Avanza solo y se puede deslizar. */
export default function Destacados({ productos }: { productos: Producto[] }) {
  const base = useBase();
  const pista = useRef<HTMLDivElement>(null);
  const [pausa, setPausa] = useState(false);

  const mover = (dir: 1 | -1) => {
    const el = pista.current;
    if (!el) return;
    const tarjeta = el.firstElementChild as HTMLElement | null;
    const paso = (tarjeta?.offsetWidth ?? 240) + 16;
    const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir === 1 && alFinal) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * paso, behavior: "smooth" });
  };

  useEffect(() => {
    if (pausa || productos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => mover(1), SEGUNDOS * 1000);
    return () => clearInterval(t);
  }, [pausa, productos.length]);

  return (
    <section
      className="border-b bg-marca-50/60"
      aria-roledescription="carrusel"
      aria-label="Productos más vendidos"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onTouchStart={() => setPausa(true)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold sm:text-xl">Lo más vendido</h2>
          {productos.length > 1 && (
            <div className="flex gap-2">
              <button onClick={() => mover(-1)} className="boton-secundario h-9 w-9 p-0" aria-label="Anterior">‹</button>
              <button onClick={() => mover(1)} className="boton-secundario h-9 w-9 p-0" aria-label="Siguiente">›</button>
            </div>
          )}
        </div>
        <div ref={pista} className="-mt-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {productos.map((p) => (
            <article key={p.id} className="tarjeta-producto group flex w-[70%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-white shadow-sm sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]">
              <Link href={`${base}/producto/${p.id}`} className="relative block overflow-hidden">
                <ImagenProducto src={p.imagen_url} alt={p.nombre} className="foto-zoom aspect-square w-full" />
                {p.nuevo && <EtiquetaNuevo />}
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Link href={`${base}/producto/${p.id}`} className="line-clamp-2 font-semibold hover:text-marca-700">
                  {p.nombre}
                </Link>
                <div className="mt-auto">
                  <BotonAgregar producto={p} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
