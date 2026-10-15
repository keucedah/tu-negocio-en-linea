"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/admin", texto: "Clientes" },
  { href: "/admin/pagos", texto: "Pagos" },
  { href: "/admin/mototaxistas", texto: "Mototaxistas" },
  { href: "/admin/anuncios", texto: "Anuncios" },
  { href: "/admin/publicidad", texto: "Publicidad" },
  { href: "/admin/planes", texto: "Planes" },
  { href: "/admin/tipos", texto: "Tipos de negocio" },
  { href: "/admin/solicitudes", texto: "Solicitudes" },
  { href: "/admin/ajustes", texto: "Ajustes" },
];

export default function MenuAdmin({ pendientes }: { pendientes: number }) {
  const ruta = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {ENLACES.map((e) => {
        const activo = e.href === "/admin" ? ruta === "/admin" || ruta.startsWith("/admin/clientes") : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`relative whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-semibold ${activo ? "bg-gray-50 text-marino-900" : "text-gray-300 hover:text-white"}`}
          >
            {e.texto}
            {e.href === "/admin/solicitudes" && pendientes > 0 && (
              <span className="ml-1.5 rounded-full bg-marca-500 px-1.5 text-xs text-white">{pendientes}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
