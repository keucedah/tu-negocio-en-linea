import Link from "next/link";
import type { ReactNode } from "react";
import { Simbolo } from "@/components/Marca";
import type { Ajustes } from "@/lib/panel/types";
import { formatearCelular } from "@/lib/telefono";

/** Fecha de la última revisión de las políticas (2.6.1). */
export const FECHA_POLITICAS = "17 de octubre de 2026";

/** Marco común de las páginas de Privacidad y Términos. */
export default function Legal({ ajustes, titulo, children }: { ajustes: Ajustes; titulo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-marino-900 px-4 py-3 text-white">
        <Link href="/" className="mx-auto flex max-w-3xl items-center gap-2">
          <Simbolo className="h-9 w-9 shrink-0" />
          <span className="font-bold">{ajustes.nombre_negocio}</span>
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="tarjeta legal">
          <h1 className="text-2xl font-black text-gray-900 sm:text-3xl">{titulo}</h1>
          <p className="mt-1 text-sm text-gray-500">Última actualización: {FECHA_POLITICAS}</p>
          {children}
        </article>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="hover:underline">Inicio</Link>
          {" · "}
          <Link href="/privacidad" className="hover:underline">Privacidad</Link>
          {" · "}
          <Link href="/terminos" className="hover:underline">Términos</Link>
        </p>
      </main>
    </div>
  );
}

/** Cómo contactarnos, con los datos de Ajustes. */
export function Contacto({ ajustes }: { ajustes: Ajustes }) {
  const celular = formatearCelular(ajustes.codigo_pais, ajustes.celular);
  return (
    <ul>
      <li><b>{ajustes.nombre_negocio}</b></li>
      {ajustes.direccion && <li>Dirección: {ajustes.direccion}</li>}
      {celular && <li>WhatsApp: {celular}</li>}
      {ajustes.correo && <li>Correo: {ajustes.correo}</li>}
    </ul>
  );
}
