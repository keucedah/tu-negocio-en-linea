"use client";

import { useAparecer } from "@/components/tienda/useAparecer";

/** Lo que va adentro (cada hijo) entra con un efecto suave cuando aparece en pantalla al bajar. */
export default function Revelar({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useAparecer<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`revelar ${className ?? ""}`}>
      {children}
    </div>
  );
}
