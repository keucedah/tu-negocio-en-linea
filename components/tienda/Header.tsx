"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCarrito } from "./CartProvider";
import { useBase } from "./BaseTienda";
import type { Tienda } from "@/lib/tienda/types";

export default function Header({ tienda }: { tienda: Tienda }) {
  const { totalUnidades, abrir } = useCarrito();
  const base = useBase();
  return (
    <header className="sticky top-0 z-30 border-b border-encabezado-2 bg-encabezado text-encabezado-texto">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={base || "/"} className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight">
          {tienda.logoUrl ? (
            <img src={tienda.logoUrl} alt="" className="h-9 max-w-[120px] rounded object-contain" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marca-500 text-base text-white" aria-hidden>
              {tienda.nombre.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className="line-clamp-1">{tienda.nombre}</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={abrir}
            className="relative flex items-center gap-2 rounded-lg bg-encabezado-texto/10 px-3 py-2 text-sm font-medium hover:bg-encabezado-texto/20"
            aria-label="Abrir mi pedido"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="hidden sm:inline">Mi pedido</span>
            {totalUnidades > 0 && (
              <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-marca-500 px-1.5 text-center text-xs font-bold leading-5 text-white">
                {totalUnidades}
              </span>
            )}
          </button>
          {/* Acceso discreto para el administrador */}
          <Link href={`${base}/entrar`} className="text-xs font-medium uppercase tracking-wider text-encabezado-texto/60 hover:text-encabezado-texto">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
