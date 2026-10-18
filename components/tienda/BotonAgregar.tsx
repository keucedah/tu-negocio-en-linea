"use client";

import { useState } from "react";
import { useCarrito } from "./CartProvider";
import type { Producto } from "@/lib/tienda/types";
import { volarAlCarrito } from "./volarAlCarrito";

/**
 * Botón para agregar al carrito. Si el producto tiene tallas o medidas, primero se elige una:
 * en la tarjeta salen al tocar "Elegir talla"; en la página del producto (grande) se ven siempre.
 * La palabra (talla, medida, presentación…) es la del tipo de negocio de la tienda (2.7).
 */
export default function BotonAgregar({ producto, grande = false }: { producto: Producto; grande?: boolean }) {
  const { agregar, palabra } = useCarrito();
  const [agregado, setAgregado] = useState<string | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [talla, setTalla] = useState<string | null>(null);
  const tallas = producto.tallas ?? [];

  const meter = (boton: HTMLElement, t: string | null) => {
    volarAlCarrito(boton);
    agregar({
      id: producto.id,
      nombre: producto.nombre,
      imagen_url: producto.imagen_mini_url || producto.imagen_url,
      precio: producto.precio ?? null,
      talla: t,
    });
    setAgregado(t ? `✓ ${palabra.Una} ${t}` : "✓ Agregado");
    setTimeout(() => setAgregado(null), 1400);
  };

  const textoAgregar = <span>Agregar<span className="hidden sm:inline"> al carrito</span></span>;

  if (tallas.length === 0) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          meter(e.currentTarget, null);
        }}
        className={`boton-primario w-full ${grande ? "py-3 text-base" : ""}`}
      >
        {agregado ?? textoAgregar}
      </button>
    );
  }

  const chips = (alTocar: (t: string, boton: HTMLElement) => void, elegida: string | null) => (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Elige tu ${palabra.una}`}>
      {tallas.map((t) => (
        <button
          key={t}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            alTocar(t, e.currentTarget);
          }}
          aria-pressed={elegida === t}
          className={`min-w-10 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition ${
            elegida === t ? "border-marca-600 bg-marca-600 text-white" : "border-gray-300 bg-white text-gray-800 hover:border-marca-500"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );

  // Página del producto: se elige la talla y luego se agrega
  if (grande) {
    return (
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-gray-700">{palabra.Una}{talla ? `: ${talla}` : ""}</p>
          {chips((t) => setTalla((x) => (x === t ? null : t)), talla)}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (talla) meter(e.currentTarget, talla);
          }}
          disabled={!talla}
          className="boton-primario w-full py-3 text-base"
        >
          {agregado ?? (talla ? `Agregar ${palabra.una} ${talla} al carrito` : `Elige tu ${palabra.una}`)}
        </button>
      </div>
    );
  }

  // Tarjeta: al tocar una talla se agrega de una vez
  if (eligiendo) {
    return (
      <div className="space-y-2 rounded-lg bg-marca-50 p-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Elige tu {palabra.una}</p>
          <button type="button" onClick={() => setEligiendo(false)} className="text-xs text-gray-500 hover:text-gray-800" aria-label={`Cerrar ${palabra.varias}`}>
            ✕
          </button>
        </div>
        {chips((t, boton) => {
          meter(boton, t);
          setEligiendo(false);
        }, null)}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setEligiendo(true);
      }}
      className="boton-primario w-full"
    >
      {agregado ?? `Elegir ${palabra.una}`}
    </button>
  );
}
