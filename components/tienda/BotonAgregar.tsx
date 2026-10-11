"use client";

import { useState } from "react";
import { useCarrito } from "./CartProvider";
import type { Producto } from "@/lib/tienda/types";

export default function BotonAgregar({ producto, grande = false }: { producto: Producto; grande?: boolean }) {
  const { agregar } = useCarrito();
  const [agregado, setAgregado] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        agregar({ id: producto.id, nombre: producto.nombre, imagen_url: producto.imagen_mini_url || producto.imagen_url });
        setAgregado(true);
        setTimeout(() => setAgregado(false), 1200);
      }}
      className={`boton-primario w-full ${grande ? "py-3 text-base" : ""}`}
    >
      {agregado ? "✓ Agregado" : (<span>Agregar<span className="hidden sm:inline"> al carrito</span></span>)}
    </button>
  );
}
