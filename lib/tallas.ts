/** Grupos de tallas que el dueño marca con casillas. Si falta alguna, la escribe a mano. */
export const GRUPOS_TALLAS = [
  { nombre: "Ropa", tallas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { nombre: "Calzado", tallas: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
  { nombre: "Pantalón (cintura)", tallas: ["28", "30", "32", "34", "36", "38", "40", "42"] },
  { nombre: "Niños", tallas: ["2", "4", "6", "8", "10", "12", "14", "16"] },
  { nombre: "Bebé", tallas: ["0-3 m", "3-6 m", "6-9 m", "9-12 m", "12-18 m", "18-24 m"] },
];

export const MAX_TALLAS = 40;
export const LARGO_TALLA = 15;

/** Limpia la lista de tallas: sin espacios de más, sin repetidas y con un límite. */
export function limpiarTallas(lista: unknown): string[] {
  if (!Array.isArray(lista)) return [];
  const vistas = new Set<string>();
  const salida: string[] = [];
  for (const t of lista) {
    const talla = String(t ?? "").replace(/\s+/g, " ").trim().slice(0, LARGO_TALLA);
    const clave = talla.toLowerCase();
    if (!talla || vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push(talla);
    if (salida.length >= MAX_TALLAS) break;
  }
  return salida;
}
