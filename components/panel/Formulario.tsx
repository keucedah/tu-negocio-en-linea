"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Resultado } from "@/app/admin/acciones";

/** Formulario con mensaje de éxito o error debajo del botón. */
export default function Formulario({
  accion,
  children,
  boton,
  limpiar = false,
  className = "space-y-3",
  claseBoton = "boton-primario w-full",
}: {
  accion: (prev: Resultado, f: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  boton: string;
  limpiar?: boolean;
  className?: string;
  claseBoton?: string;
}) {
  const [resultado, enviar, enviando] = useActionState(accion, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (limpiar && resultado?.ok) ref.current?.reset();
  }, [resultado, limpiar]);

  return (
    <form ref={ref} action={enviar} className={className}>
      {children}
      <button type="submit" disabled={enviando} className={claseBoton}>
        {enviando ? "Guardando…" : boton}
      </button>
      {resultado && (
        <p className={`rounded-lg px-3 py-2 text-sm ${resultado.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {resultado.mensaje}
        </p>
      )}
    </form>
  );
}
