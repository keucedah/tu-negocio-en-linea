"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ItemCarrito = {
  /** Identifica la línea del carrito: el mismo producto en otra talla es otra línea. */
  clave: string;
  id: number;
  nombre: string;
  imagen_url: string | null;
  /** Precio al momento de agregarlo; null si la tienda no lo muestra. */
  precio?: number | null;
  /** Talla elegida por el cliente, si el producto tiene tallas. */
  talla?: string | null;
  cantidad: number;
};

const claveDe = (id: number, talla?: string | null) => (talla ? `${id}|${talla}` : String(id));

type CarritoCtx = {
  items: ItemCarrito[];
  totalUnidades: number;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (item: Omit<ItemCarrito, "cantidad" | "clave">, cantidad?: number) => void;
  cambiarCantidad: (clave: string, cantidad: number) => void;
  quitar: (clave: string) => void;
  vaciar: () => void;
};

const Ctx = createContext<CarritoCtx | null>(null);
// Cada tienda guarda su propio carrito en el navegador.
export function CartProvider({ clave, children }: { clave: string; children: React.ReactNode }) {
  const CLAVE = `carrito-${clave}`;
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      // Los carritos guardados antes de las tallas no traen "clave": se le pone
      if (guardado) setItems((JSON.parse(guardado) as ItemCarrito[]).map((i) => ({ ...i, clave: i.clave ?? claveDe(i.id, i.talla) })));
    } catch {
      // almacenamiento no disponible: el carrito funciona solo en esta visita
    }
    setCargado(true);
  }, [CLAVE]);

  useEffect(() => {
    if (!cargado) return;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {}
  }, [items, cargado, CLAVE]);

  const agregar = useCallback((item: Omit<ItemCarrito, "cantidad" | "clave">, cantidad = 1) => {
    const clave = claveDe(item.id, item.talla);
    setItems((prev) => {
      const existe = prev.find((i) => i.clave === clave);
      if (existe) return prev.map((i) => (i.clave === clave ? { ...i, ...item, cantidad: i.cantidad + cantidad } : i));
      return [...prev, { ...item, clave, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((clave: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0 ? prev.filter((i) => i.clave !== clave) : prev.map((i) => (i.clave === clave ? { ...i, cantidad } : i)),
    );
  }, []);

  const valor = useMemo<CarritoCtx>(
    () => ({
      items,
      totalUnidades: items.reduce((s, i) => s + i.cantidad, 0),
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar,
      cambiarCantidad,
      quitar: (clave) => setItems((prev) => prev.filter((i) => i.clave !== clave)),
      vaciar: () => setItems([]),
    }),
    [items, abierto, agregar, cambiarCantidad],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CartProvider");
  return ctx;
}
