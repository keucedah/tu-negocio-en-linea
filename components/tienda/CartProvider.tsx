"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ItemCarrito = {
  id: number;
  nombre: string;
  imagen_url: string | null;
  cantidad: number;
};

type CarritoCtx = {
  items: ItemCarrito[];
  totalUnidades: number;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (item: Omit<ItemCarrito, "cantidad">, cantidad?: number) => void;
  cambiarCantidad: (id: number, cantidad: number) => void;
  quitar: (id: number) => void;
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
      if (guardado) setItems(JSON.parse(guardado));
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

  const agregar = useCallback((item: Omit<ItemCarrito, "cantidad">, cantidad = 1) => {
    setItems((prev) => {
      const existe = prev.find((i) => i.id === item.id);
      if (existe) return prev.map((i) => (i.id === item.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
      return [...prev, { ...item, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((id: number, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, cantidad } : i)),
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
      quitar: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
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
