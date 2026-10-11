"use client";

import { usePathname } from "next/navigation";
import { IcoWhatsApp } from "@/components/panel/Iconos";
import { enlaceWhatsApp } from "@/lib/whatsapp";

/** Botón redondo de WhatsApp abajo a la derecha del catálogo, con un pulso suave. No sale en el panel del dueño. */
export default function WhatsAppFlotante({ whatsapp, tienda }: { whatsapp: string; tienda: string }) {
  const ruta = usePathname();
  if (!whatsapp || /\/(admin|entrar)(\/|$)/.test(ruta)) return null;
  const texto = `Hola ${tienda}, vi su catálogo en línea y tengo una consulta.`;
  return (
    <a
      href={enlaceWhatsApp(whatsapp, texto)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir a ${tienda} por WhatsApp`}
      className="group fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:bg-[#1ebe5a] sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 motion-safe:animate-[pulso_2.4s_ease-out_infinite]" aria-hidden />
      <IcoWhatsApp className="relative h-8 w-8" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow transition group-hover:opacity-100 sm:block">
        ¿Tienes una consulta?
      </span>
    </a>
  );
}
