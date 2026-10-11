"use client";

import { useState } from "react";

export default function BotonCopiar({ texto, etiqueta = "Copiar", className = "boton-secundario" }: { texto: string; etiqueta?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
        } catch {
          // Navegadores sin permiso de portapapeles: se selecciona en un cuadro para copiar a mano
          window.prompt("Copia este texto:", texto);
        }
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? "¡Copiado!" : etiqueta}
    </button>
  );
}
