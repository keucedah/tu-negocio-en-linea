export type GrupoMedidas = { nombre: string; tallas: string[] };

/**
 * Grupos de siempre (ropa y calzado). Se usan cuando la tienda no tiene tipo de negocio
 * o todavía no se ejecutó el SQL de la 2.7. Desde la 2.7 cada tipo tiene los suyos.
 */
export const GRUPOS_TALLAS: GrupoMedidas[] = [
  { nombre: "Ropa", tallas: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { nombre: "Calzado", tallas: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
  { nombre: "Pantalón (cintura)", tallas: ["28", "30", "32", "34", "36", "38", "40", "42"] },
  { nombre: "Niños", tallas: ["2", "4", "6", "8", "10", "12", "14", "16"] },
  { nombre: "Bebé", tallas: ["0-3 m", "3-6 m", "6-9 m", "9-12 m", "12-18 m", "18-24 m"] },
];

export const MAX_TALLAS = 40;
export const LARGO_TALLA = 20;

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

// --- Palabra y grupos por tipo de negocio (2.7) ---

/** Formas de la palabra del tipo de negocio: talla / tallas / Talla / Tallas. */
export type Palabra = {
  una: string;
  varias: string;
  Una: string;
  Varias: string;
  /** Femenina (la talla, la medida) o masculina (el tamaño, el color): para "Otra" / "Otro". */
  femenina: boolean;
};

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Plural en español: talla → tallas, presentación → presentaciones, color → colores. */
function plural(s: string) {
  if (/[aeiouáéíóú]$/i.test(s)) return s + "s";
  if (/ón$/i.test(s)) return s.slice(0, -2) + "ones";
  if (/z$/i.test(s)) return s.slice(0, -1) + "ces";
  return s + "es";
}

/** De la palabra guardada (singular) a sus cuatro formas. Vacía = "talla", como antes de la 2.7. */
export function palabraMedida(singular?: string | null): Palabra {
  const una = String(singular ?? "").replace(/\s+/g, " ").trim().toLowerCase() || "talla";
  const varias = plural(una);
  const femenina = /(a|ión|dad|tad|tud)$/.test(una);
  return { una, varias, Una: mayuscula(una), Varias: mayuscula(varias), femenina };
}

export const MAX_GRUPOS = 12;

/** Lee los grupos escritos uno por línea: "Pulgadas: 1/4\", 1/2\"". Una línea sin nombre usa "Comunes". */
export function leerGrupos(texto?: string | null): GrupoMedidas[] {
  const grupos: GrupoMedidas[] = [];
  for (const linea of String(texto ?? "").split(/\r?\n/)) {
    if (!linea.trim()) continue;
    const dos = linea.indexOf(":");
    const nombre = (dos >= 0 ? linea.slice(0, dos) : "").trim().slice(0, 30) || "Comunes";
    const tallas = limpiarTallas((dos >= 0 ? linea.slice(dos + 1) : linea).split(","));
    if (tallas.length) grupos.push({ nombre, tallas });
    if (grupos.length >= MAX_GRUPOS) break;
  }
  return grupos;
}

/** Deja el texto de grupos ordenado, como se guarda en el tipo de negocio. */
export const limpiarGrupos = (texto?: string | null) =>
  leerGrupos(texto)
    .map((g) => `${g.nombre}: ${g.tallas.join(", ")}`)
    .join("\n")
    .slice(0, 2000);

/** Palabra y grupos de una tienda según su tipo de negocio. */
export type Medidas = { palabra: string; grupos: GrupoMedidas[] };

export function medidasDeTipo(tipo?: { medida_palabra?: string | null; medida_grupos?: string | null } | null): Medidas {
  // Sin tipo o sin el SQL de la 2.7: tallas de siempre
  if (!tipo || tipo.medida_palabra == null || tipo.medida_palabra === "") return { palabra: "talla", grupos: GRUPOS_TALLAS };
  return { palabra: palabraMedida(tipo.medida_palabra).una, grupos: leerGrupos(tipo.medida_grupos) };
}
