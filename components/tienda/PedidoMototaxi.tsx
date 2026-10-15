"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ItemCarrito } from "./CartProvider";
import type { MototaxiPublico } from "@/lib/mototaxis";
import { enlaceWhatsApp, mensajeMototaxi, mensajeTiendaMototaxi, totalPedido } from "@/lib/whatsapp";
import { crearFichaMototaxi, descargar } from "@/lib/fichaMototaxi";
import { contar } from "@/lib/contar";
import { lempiras } from "@/lib/precio";

export type TiendaPedido = { nombre: string; direccion: string; municipio: string; color: string; whatsapp: string };

/** Mezcla la lista (cada vez que se abre, otro orden) y deja los suspendidos al final. */
function mezclar(lista: MototaxiPublico[]) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return [...a.filter((m) => !m.suspendido), ...a.filter((m) => m.suspendido)];
}

function Ficha({ m, grande = false }: { m: MototaxiPublico; grande?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${grande ? "flex-col text-center" : ""}`}>
      <div className={`shrink-0 overflow-hidden rounded-full bg-gray-100 ${grande ? "h-28 w-28 ring-4 ring-white shadow" : "h-14 w-14"}`}>
        {m.foto ? <img src={m.foto} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-2xl">🛺</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-bold leading-tight ${grande ? "text-2xl" : ""}`}>{m.nombre}</p>
        <p className="text-sm text-gray-600">
          {m.codigo}
          {m.numero && <> · Mototaxi N.º {m.numero}</>}
        </p>
        {m.direccion && <p className="truncate text-xs text-gray-500">{m.direccion}</p>}
      </div>
    </div>
  );
}

export default function PedidoMototaxi({
  items,
  mototaxis,
  tienda,
  nombreInicial,
  notaInicial,
  alCerrar,
  alVaciar,
}: {
  items: ItemCarrito[];
  mototaxis: MototaxiPublico[];
  tienda: TiendaPedido;
  nombreInicial: string;
  notaInicial: string;
  alCerrar: () => void;
  alVaciar: () => void;
}) {
  const lista = useMemo(() => mezclar(mototaxis), [mototaxis]);
  const [elegido, setElegido] = useState<MototaxiPublico | null>(null);
  const [nombre, setNombre] = useState(nombreInicial);
  const [direccion, setDireccion] = useState("");
  const [nota, setNota] = useState(notaInicial);
  const [enviado, setEnviado] = useState(false);
  const [aviso, setAviso] = useState("");
  const imagen = useRef<{ clave: string; blob: Blob | null } | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const total = totalPedido(items);
  const datosImagen = { tienda: tienda.nombre, color: tienda.color, cliente: nombre.trim(), total: total ? lempiras(total.monto) : "" };
  const clave = elegido ? JSON.stringify([elegido.id, datosImagen]) : "";

  // Prepara la imagen del mototaxista antes de enviar, así se descarga en el mismo toque
  useEffect(() => {
    if (!elegido) return;
    let vigente = true;
    const t = setTimeout(async () => {
      const blob = await crearFichaMototaxi(elegido, datosImagen);
      if (vigente) imagen.current = { clave, blob };
    }, 400);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [elegido, enviado]);

  const nombreArchivo = elegido ? `mototaxista-${elegido.codigo}.jpg` : "mototaxista.jpg";

  async function bajarImagen() {
    if (!elegido) return;
    const lista = imagen.current?.clave === clave ? imagen.current.blob : await crearFichaMototaxi(elegido, datosImagen);
    if (lista) descargar(lista, nombreArchivo);
    else setAviso("Tu navegador no pudo crear la imagen. Toma una captura de pantalla de esta ficha.");
  }

  const datos = elegido && {
    mototaxi: { nombre: elegido.nombre, codigo: elegido.codigo, numero: elegido.numero, celular: elegido.celular },
    cliente: nombre,
    direccionCliente: direccion,
    nota,
    tienda: tienda.nombre,
    direccionTienda: [tienda.direccion, tienda.municipio && !tienda.direccion.toLowerCase().includes(tienda.municipio.toLowerCase()) ? tienda.municipio : ""]
      .filter(Boolean)
      .join(", "),
  };

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!elegido || !datos) return;
    if (!nombre.trim()) return setAviso("Escribe tu nombre.");
    if (!direccion.trim()) return setAviso("Escribe a dónde te llevan los productos.");
    setAviso("");
    // Primero la imagen (si ya está lista se descarga en este mismo toque) y luego WhatsApp
    if (imagen.current?.clave === clave && imagen.current.blob) descargar(imagen.current.blob, nombreArchivo);
    else void bajarImagen();
    window.open(enlaceWhatsApp(elegido.whatsapp, mensajeMototaxi(items, datos)), "_blank", "noopener");
    contar("mototaxi", elegido.id);
    setEnviado(true);
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white" role="dialog" aria-label="Enviar con mototaxi">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <button
          type="button"
          onClick={() => (elegido && !enviado ? setElegido(null) : alCerrar())}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Regresar"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h2 className="text-lg font-bold">{enviado ? "¡Pedido enviado!" : elegido ? "Tus datos" : "Elige tu mototaxista"}</h2>
      </div>

      <div ref={panel} className="flex-1 overflow-y-auto px-5 py-4">
        {!elegido && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              El mototaxista va a <b>{tienda.nombre}</b> por tus productos y te los lleva. La tarifa la acuerdas con él por WhatsApp.
            </p>
            <ul className="space-y-2">
              {lista.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={m.suspendido}
                    onClick={() => setElegido(m)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${m.suspendido ? "cursor-not-allowed bg-gray-50 opacity-60 grayscale" : "hover:border-marca-500 hover:bg-marca-50"}`}
                    aria-label={m.suspendido ? `${m.nombre}, suspendido` : `Elegir a ${m.nombre}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1"><Ficha m={m} /></div>
                      {m.fotoMoto && <img src={m.fotoMoto} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />}
                    </div>
                    {m.suspendido && <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">Suspendido</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {elegido && !enviado && datos && (
          <form id="form-mototaxi" onSubmit={enviar} className="space-y-3">
            <div className="rounded-2xl border bg-gray-50 p-4">
              <Ficha m={elegido} grande />
              {elegido.fotoMoto && <img src={elegido.fotoMoto} alt={`Mototaxi de ${elegido.nombre}`} className="mt-3 aspect-video w-full rounded-xl object-cover" />}
              <p className="mt-2 text-center text-xs text-gray-500">Al enviar se descarga una imagen con estos datos, como comprobante.</p>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Tu nombre *</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={80} className="campo" placeholder="Tu nombre" autoComplete="name" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">¿A dónde te llevan los productos? *</span>
              <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} required rows={2} maxLength={300} className="campo resize-none" placeholder="Barrio, calle, color de la casa, punto de referencia…" autoComplete="street-address" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Comentario (opcional)</span>
              <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300} className="campo" placeholder="Ej: llamar al llegar" />
            </label>
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <p><b>Tienda:</b> {tienda.nombre}{datos.direccionTienda && ` · ${datos.direccionTienda}`}</p>
              {total && <p><b>{total.completo ? "Total" : "Total con precio"}:</b> {lempiras(total.monto)} (más la tarifa del mototaxi)</p>}
            </div>
          </form>
        )}

        {enviado && elegido && datos && (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl border p-4">
              <Ficha m={elegido} grande />
              {elegido.fotoMoto && <img src={elegido.fotoMoto} alt={`Mototaxi de ${elegido.nombre}`} className="mt-3 aspect-video w-full rounded-xl object-cover" />}
            </div>
            <p className="text-sm text-gray-700">
              Se abrió WhatsApp con tu pedido para <b>{elegido.nombre}</b>. Revisa el mensaje y presiona enviar. La imagen con sus datos se descargó en tu teléfono.
            </p>
            <div className="grid gap-2">
              <button type="button" onClick={bajarImagen} className="boton-secundario w-full">Descargar la imagen otra vez</button>
              {tienda.whatsapp && (
                <a href={enlaceWhatsApp(tienda.whatsapp, mensajeTiendaMototaxi(items, datos))} target="_blank" rel="noopener noreferrer" className="boton-whatsapp w-full">
                  Avisar también a la tienda
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  alVaciar();
                  alCerrar();
                }}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Vaciar carrito y terminar
              </button>
            </div>
          </div>
        )}
        {aviso && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{aviso}</p>}
      </div>

      {elegido && !enviado && (
        <div className="border-t bg-gray-50 px-5 py-4">
          <button type="submit" form="form-mototaxi" className="boton-whatsapp w-full py-3 text-base">
            Enviar pedido a {elegido.nombre.split(" ")[0]}
          </button>
        </div>
      )}
    </div>
  );
}
