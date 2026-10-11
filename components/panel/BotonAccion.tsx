"use client";

import { useState, useTransition } from "react";
import type { Resultado } from "@/app/admin/acciones";

/** Botón que ejecuta una acción del servidor, con confirmación opcional. */
export default function BotonAccion({
  accion,
  confirmacion,
  children,
  className = "text-sm font-medium text-red-600 hover:underline",
}: {
  accion: () => Promise<Resultado>;
  confirmacion?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pendiente}
        className={className}
        onClick={() => {
          if (confirmacion && !confirm(confirmacion)) return;
          setError(null);
          iniciar(async () => {
            const r = await accion();
            if (r && !r.ok) setError(r.mensaje);
          });
        }}
      >
        {pendiente ? "…" : children}
      </button>
      {error && <span className="mt-1 max-w-xs text-right text-xs text-red-600">{error}</span>}
    </span>
  );
}
