"use client";

import { useState } from "react";

/** Escribe un mensaje y ábrelo en WhatsApp con el número del cliente. */
export default function MensajeLibre({ numero, saludo }: { numero: string; saludo: string }) {
  const [texto, setTexto] = useState(saludo);
  return (
    <div className="space-y-2">
      <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} className="campo" />
      <a
        href={`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="boton-whatsapp w-full"
      >
        Enviar por WhatsApp
      </a>
    </div>
  );
}
