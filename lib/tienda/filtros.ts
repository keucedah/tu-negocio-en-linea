// Filtros del catálogo (búsqueda, categoría, orden y página). Se usa en el servidor y en el navegador.

export const POR_PAGINA = 24;
export type Orden = "recientes" | "az" | "za";
export type Filtros = { q: string; categoria: number | null; orden: Orden; pagina: number };

/** Igual que en el buscador: minúsculas y sin tildes (la base guarda el nombre así en nombre_busqueda). */
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Lee los filtros de la dirección (?q=…&categoria=…&orden=…&pagina=…). */
export function leerFiltros(p: Record<string, string | string[] | undefined>): Filtros {
  const uno = (k: string) => (Array.isArray(p[k]) ? p[k][0] : p[k]) ?? "";
  const orden = uno("orden");
  const categoria = Number(uno("categoria"));
  return {
    q: uno("q").slice(0, 60),
    categoria: Number.isInteger(categoria) && categoria > 0 ? categoria : null,
    orden: orden === "az" || orden === "za" ? orden : "recientes",
    pagina: Math.max(1, Math.floor(Number(uno("pagina")) || 1)),
  };
}

