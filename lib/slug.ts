// Dirección (slug) y dominio de las tiendas. Sin nada del servidor: se usa también en formularios.

const RESERVADAS = new Set(["admin", "entrar", "api", "demo", "producto", "www", "_next"]);

/** "Ferretería El Constructor" → "ferreteria-el-constructor" */
export function sugerirSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function validarSlug(slug: string): string | null {
  if (!/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) {
    return "La dirección de la tienda solo puede tener letras minúsculas, números y guiones (sin espacios ni tildes), hasta 40.";
  }
  if (RESERVADAS.has(slug)) return `“${slug}” está reservada; elige otra dirección.`;
  return null;
}

/** "https://www.MiTienda.com/" → "mitienda.com". Vacío si no parece un dominio. */
export function normalizarDominio(texto: string): string {
  const d = texto
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && d.length <= 120 ? d : "";
}
