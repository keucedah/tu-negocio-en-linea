"use client";

import { useEffect, useState } from "react";
import { useCarrito } from "./CartProvider";
import ImagenProducto from "./ImagenProducto";
import { enlaceWhatsApp, mensajeCotizacion, totalPedido } from "@/lib/whatsapp";
import { lempiras } from "@/lib/precio";
import PedidoMototaxi, { type TiendaPedido } from "./PedidoMototaxi";
import type { MototaxiPublico } from "@/lib/mototaxis";

export default function CartDrawer({
  whatsapp,
  tienda,
  mototaxis = [],
}: {
  whatsapp: string;
  /** Datos de la tienda para el pedido con mototaxi (2.5). */
  tienda?: TiendaPedido;
  mototaxis?: MototaxiPublico[];
}) {
  const { items, abierto, cerrar, cambiarCantidad, quitar, vaciar, totalUnidades, palabra } = useCarrito();
  const [nombre, setNombre] = useState("");
  const [nota, setNota] = useState("");
  // Cada vez que se abre la lista de mototaxistas sale en otro orden
  const [conMototaxi, setConMototaxi] = useState(0);
  const hayMototaxis = Boolean(tienda) && mototaxis.length > 0;

  useEffect(() => {
    if (!abierto || items.length === 0) setConMototaxi(0);
  }, [abierto, items.length]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, cerrar]);

  const total = totalPedido(items);

  const cotizar = () => {
    window.open(enlaceWhatsApp(whatsapp, mensajeCotizacion(items, { nombre, nota }, palabra.una)), "_blank", "noopener");
  };

  return (
    <div className={`fixed inset-0 z-40 ${abierto ? "" : "pointer-events-none"}`} aria-hidden={!abierto}>
      <div
        onClick={cerrar}
        className={`absolute inset-0 bg-black/40 transition-opacity ${abierto ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Mi pedido"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold">Tu pedido ({totalUnidades})</h2>
          <button onClick={cerrar} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-gray-500">
            <p className="font-medium">Tu carrito está vacío.</p>
            <p className="text-sm">Agrega productos del catálogo y envíanos tu pedido por WhatsApp.</p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.clave} className="flex items-center gap-3 py-3">
                  <ImagenProducto src={i.imagen_url} alt={i.nombre} className="h-14 w-14 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.nombre}</p>
                    {i.talla && <p className="text-xs font-semibold text-marca-700">{palabra.Una} {i.talla}</p>}
                    {i.precio != null && (
                      <p className="text-xs text-gray-600">
                        {lempiras(i.precio)} c/u{i.cantidad > 1 && <> · <span className="font-semibold text-gray-800">{lempiras(i.precio * i.cantidad)}</span></>}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-1">
                      <button
                        onClick={() => cambiarCantidad(i.clave, i.cantidad - 1)}
                        className="h-7 w-7 rounded border text-gray-700 hover:bg-gray-100"
                        aria-label="Restar uno"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={i.cantidad}
                        onChange={(e) => cambiarCantidad(i.clave, Math.max(1, Number(e.target.value) || 1))}
                        className="h-7 w-14 rounded border text-center text-sm"
                        aria-label="Cantidad"
                      />
                      <button
                        onClick={() => cambiarCantidad(i.clave, i.cantidad + 1)}
                        className="h-7 w-7 rounded border text-gray-700 hover:bg-gray-100"
                        aria-label="Sumar uno"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button onClick={() => quitar(i.clave)} className="text-xs text-gray-500 hover:text-red-600">
                    Quitar
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t bg-gray-50 px-5 py-4">
              {total && (
                <p className="flex items-baseline justify-between text-sm">
                  <span className="text-gray-600">{total.completo ? "Total" : "Total de los productos con precio"}</span>
                  <span className="text-xl font-black text-gray-900">{lempiras(total.monto)}</span>
                </p>
              )}
              <input
                className="campo"
                aria-label="Tu nombre"
                placeholder="Tu nombre (opcional)"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <textarea
                className="campo resize-none"
                rows={2}
                placeholder="Comentario (opcional): medidas, marca, entrega…"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
              <button onClick={cotizar} disabled={!whatsapp} className="boton-whatsapp w-full py-3 text-base">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.24-.7.24-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.5 9.5 0 0 1-4.84-1.32l-.35-.21-3.6.94.96-3.5-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.24 4.27-9.5 9.52-9.5a9.46 9.46 0 0 1 6.73 2.79 9.43 9.43 0 0 1 2.78 6.72c0 5.24-4.27 9.5-9.51 9.5M20.13 3.88A11.36 11.36 0 0 0 12.05.5C5.76.5.64 5.62.64 11.9c0 2.01.52 3.97 1.52 5.7L.54 23.5l6.05-1.59a11.4 11.4 0 0 0 5.45 1.39h.01c6.29 0 11.41-5.12 11.41-11.4 0-3.05-1.19-5.91-3.34-8.07" />
                </svg>
                {hayMototaxis ? "Enviar pedido a la tienda" : "Enviar pedido por WhatsApp"}
              </button>
              {hayMototaxis && (
                <button
                  type="button"
                  onClick={() => setConMototaxi((n) => n + 1)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-900 bg-white py-3 text-base font-bold text-gray-900 hover:bg-gray-100"
                >
                  <span aria-hidden>🛺</span> Enviar con mototaxi
                </button>
              )}
              {!whatsapp && (
                <p className="text-center text-xs text-red-600">La tienda aún no configuró su número de WhatsApp.</p>
              )}
              <button onClick={vaciar} className="w-full text-center text-xs text-gray-500 hover:text-red-600">
                Vaciar carrito
              </button>
            </div>
          </>
        )}
        {conMototaxi > 0 && tienda && items.length > 0 && (
          <PedidoMototaxi
            key={conMototaxi}
            items={items}
            mototaxis={mototaxis}
            tienda={tienda}
            nombreInicial={nombre}
            notaInicial={nota}
            alCerrar={() => setConMototaxi(0)}
            alVaciar={vaciar}
          />
        )}
      </aside>
    </div>
  );
}
