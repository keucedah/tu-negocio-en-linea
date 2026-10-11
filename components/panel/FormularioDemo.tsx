"use client";

import { useActionState, useState } from "react";
import { enviarSolicitud } from "@/app/acciones";

export default function FormularioDemo({ whatsapp }: { whatsapp: string }) {
  const [resultado, accion, enviando] = useActionState(enviarSolicitud, null);
  const [datos, setDatos] = useState({ nombre: "", negocio: "", mensaje: "" });

  const texto =
    `Hola, quiero solicitar una demostración de la tienda en línea.\n` +
    `Nombre: ${datos.nombre}` +
    (datos.negocio ? `\nNegocio: ${datos.negocio}` : "") +
    (datos.mensaje ? `\n${datos.mensaje}` : "");
  const enlace = `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;

  if (resultado?.ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg bg-green-50 px-4 py-3 font-medium text-green-800">{resultado.mensaje}</p>
        {whatsapp && (
          <a href={enlace} target="_blank" rel="noopener noreferrer" className="boton-whatsapp w-full py-3 text-base">
            Escribirnos ahora por WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-3">
      <label className="block">
        <span className="etiqueta">Tu nombre</span>
        <input name="nombre" required maxLength={80} className="campo" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
      </label>
      <label className="block">
        <span className="etiqueta">Nombre de tu negocio</span>
        <input name="negocio" maxLength={120} className="campo" value={datos.negocio} onChange={(e) => setDatos({ ...datos, negocio: e.target.value })} />
      </label>
      <label className="block">
        <span className="etiqueta">Tu celular (WhatsApp)</span>
        <input name="celular" required inputMode="tel" maxLength={20} placeholder="9999 9999" className="campo" />
      </label>
      <label className="block">
        <span className="etiqueta">Mensaje (opcional)</span>
        <textarea name="mensaje" rows={3} maxLength={500} className="campo" placeholder="¿Qué plan te interesa? ¿Cuántos productos tienes?" value={datos.mensaje} onChange={(e) => setDatos({ ...datos, mensaje: e.target.value })} />
      </label>
      {resultado && !resultado.ok && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resultado.mensaje}</p>}
      <button disabled={enviando} className="boton-primario w-full py-3 text-base">
        {enviando ? "Enviando…" : "Solicitar demostración"}
      </button>
    </form>
  );
}
