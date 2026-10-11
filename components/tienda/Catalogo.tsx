"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { Categoria, Producto } from "@/lib/tienda/types";
import ImagenProducto from "./ImagenProducto";
import BotonAgregar from "./BotonAgregar";
import { useBase } from "./BaseTienda";

type Orden = "recientes" | "az" | "za";

const POR_PAGINA = 24;

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function Catalogo({
  categorias,
  productos,
  placeholder = "Buscar producto por nombre…",
}: {
  categorias: Categoria[];
  productos: Producto[];
  placeholder?: string;
}) {
  const router = useRouter();
  const base = useBase();
  const pathname = base || "/";
  const params = useSearchParams();

  const [busqueda, setBusqueda] = useState(params.get("q") ?? "");
  const [orden, setOrden] = useState<Orden>((params.get("orden") as Orden) || "recientes");
  const categoriaSel = params.get("categoria") ? Number(params.get("categoria")) : null;

  const inicioLista = useRef<HTMLParagraphElement>(null);

  // Cambiar un filtro vuelve a la página 1. Cambiar de página queda en el historial (botón atrás).
  const actualizarUrl = (cambios: Record<string, string | null>, nuevaEntrada = false) => {
    const p = new URLSearchParams(params.toString());
    if (!("pagina" in cambios)) p.delete("pagina");
    for (const [k, v] of Object.entries(cambios)) (v ? p.set(k, v) : p.delete(k));
    const qs = p.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (nuevaEntrada) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };

  const conteo = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of productos) if (p.categoria_id) m.set(p.categoria_id, (m.get(p.categoria_id) ?? 0) + 1);
    return m;
  }, [productos]);

  const nombreCategoria = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    const lista = productos.filter(
      (p) => (categoriaSel === null || p.categoria_id === categoriaSel) && (!q || normalizar(p.nombre).includes(q)),
    );
    if (orden === "az") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    else if (orden === "za") lista.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    else lista.sort((a, b) => b.creado_en.localeCompare(a.creado_en));
    return lista;
  }, [productos, busqueda, categoriaSel, orden]);

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, Math.floor(Number(params.get("pagina")) || 1)), totalPaginas);
  const desde = (pagina - 1) * POR_PAGINA;
  const enPagina = visibles.slice(desde, desde + POR_PAGINA);

  const irA = (n: number) => {
    actualizarUrl({ pagina: n > 1 ? String(n) : null }, true);
    inicioLista.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chip = (activo: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
      activo ? "border-marca-600 bg-marca-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-marca-500"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Buscador y orden */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              actualizarUrl({ q: e.target.value || null });
            }}
            placeholder={placeholder}
            className="campo py-2.5 pl-9"
            aria-label="Buscar producto por nombre"
          />
        </div>
        <select
          value={orden}
          onChange={(e) => {
            setOrden(e.target.value as Orden);
            actualizarUrl({ orden: e.target.value === "recientes" ? null : e.target.value });
          }}
          className="campo sm:w-48"
          aria-label="Ordenar"
        >
          <option value="recientes">Más recientes</option>
          <option value="az">Nombre: A → Z</option>
          <option value="za">Nombre: Z → A</option>
        </select>
      </div>

      {/* Categorías */}
      <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2" aria-label="Categorías">
        <button className={chip(categoriaSel === null)} onClick={() => actualizarUrl({ categoria: null })}>
          Todas ({productos.length})
        </button>
        {categorias.map((c) => (
          <button key={c.id} className={chip(categoriaSel === c.id)} onClick={() => actualizarUrl({ categoria: String(c.id) })}>
            {c.nombre} ({conteo.get(c.id) ?? 0})
          </button>
        ))}
      </nav>

      <p ref={inicioLista} className="mt-3 scroll-mt-20 text-sm text-gray-500">
        {totalPaginas > 1 && `${desde + 1}–${desde + enPagina.length} de `}
        {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
        {categoriaSel !== null && nombreCategoria.get(categoriaSel) ? ` en ${nombreCategoria.get(categoriaSel)}` : ""}
        {busqueda ? ` para “${busqueda}”` : ""}
      </p>

      {visibles.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">
          No encontramos productos con esos filtros.
          <button
            className="ml-1 font-medium text-marca-600 hover:underline"
            onClick={() => {
              setBusqueda("");
              actualizarUrl({ q: null, categoria: null });
            }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {enPagina.map((p) => (
            <li key={p.id} className="group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
              <Link href={`${base}/producto/${p.id}`} className="block">
                <ImagenProducto src={p.imagen_url} alt={p.nombre} className="aspect-square w-full" />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3">
                {p.categoria_id && (
                  <span className="text-xs font-medium uppercase tracking-wide text-marca-600">
                    {nombreCategoria.get(p.categoria_id)}
                  </span>
                )}
                <Link href={`${base}/producto/${p.id}`} className="line-clamp-2 font-semibold leading-snug hover:text-marca-700">
                  {p.nombre}
                </Link>
                <p className="line-clamp-2 flex-1 text-sm text-gray-600">{p.descripcion}</p>
                <BotonAgregar producto={p} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Páginas">
          <button className="boton-secundario min-w-11" aria-label="Primera página" onClick={() => irA(1)} disabled={pagina === 1}>
            «<span className="hidden sm:inline"> Primera</span>
          </button>
          <button className="boton-secundario min-w-11" aria-label="Página anterior" onClick={() => irA(pagina - 1)} disabled={pagina === 1}>
            ‹<span className="hidden sm:inline"> Anterior</span>
          </button>
          <span className="px-1 text-sm text-gray-600">
            Página {pagina} de {totalPaginas}
          </span>
          <button className="boton-secundario min-w-11" aria-label="Página siguiente" onClick={() => irA(pagina + 1)} disabled={pagina === totalPaginas}>
            <span className="hidden sm:inline">Siguiente </span>›
          </button>
          <button className="boton-secundario min-w-11" aria-label="Última página" onClick={() => irA(totalPaginas)} disabled={pagina === totalPaginas}>
            <span className="hidden sm:inline">Última </span>»
          </button>
        </nav>
      )}
    </div>
  );
}
