"use client";

import { useEffect, useRef } from "react";

/**
 * Las tarjetas que todavía no se ven entran con un efecto suave al bajar la página.
 * Las que ya están en pantalla al cargar se quedan quietas, y sin JavaScript todo se ve normal.
 */
export function useAparecer<T extends HTMLElement>(cambio: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const cont = ref.current;
    if (!cont || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const alto = window.innerHeight;
    const hijos = Array.from(cont.children) as HTMLElement[];
    const pendientes = hijos.filter((h) => h.getBoundingClientRect().top > alto);
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          // Las tarjetas de una misma fila entran una tras otra
          const fila = hijos.filter((h) => h.offsetTop === el.offsetTop);
          const retraso = Math.max(0, fila.indexOf(el)) * 70;
          el.style.transitionDelay = `${retraso}ms`;
          el.classList.remove("por-aparecer");
          // Sin el retraso después, para que el efecto al pasar el mouse responda al instante
          setTimeout(() => (el.style.transitionDelay = ""), retraso + 600);
          obs.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    for (const el of pendientes) {
      el.classList.add("por-aparecer");
      obs.observe(el);
    }
    return () => {
      obs.disconnect();
      for (const el of pendientes) el.classList.remove("por-aparecer");
    };
  }, [cambio]);

  return ref;
}
