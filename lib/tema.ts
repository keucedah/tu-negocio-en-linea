// Colores de cada tienda: a partir del color principal y el del encabezado se arman
// los tonos que usa el sitio (variables CSS que lee Tailwind en tailwind.config.ts).

export const COLOR_PRINCIPAL = "#ea580c";
export const COLOR_ENCABEZADO = "#111827";

/** Colores sugeridos en el panel de la tienda. */
export const MUESTRAS = [
  { nombre: "Naranja", hex: "#ea580c" },
  { nombre: "Rojo", hex: "#dc2626" },
  { nombre: "Rosado", hex: "#db2777" },
  { nombre: "Lila", hex: "#9333ea" },
  { nombre: "Morado", hex: "#7c3aed" },
  { nombre: "Azul", hex: "#2563eb" },
  { nombre: "Celeste", hex: "#0891b2" },
  { nombre: "Verde", hex: "#16a34a" },
  { nombre: "Verde lima", hex: "#65a30d" },
  { nombre: "Café", hex: "#b45309" },
  { nombre: "Dorado", hex: "#ca8a04" },
  { nombre: "Negro", hex: "#111827" },
];

export const MUESTRAS_ENCABEZADO = [
  { nombre: "Gris oscuro", hex: "#111827" },
  { nombre: "Negro", hex: "#0a0a0a" },
  { nombre: "Azul marino", hex: "#172554" },
  { nombre: "Verde oscuro", hex: "#14532d" },
  { nombre: "Vino", hex: "#4a044e" },
  { nombre: "Café oscuro", hex: "#292524" },
  { nombre: "Blanco", hex: "#ffffff" },
];

/** Fondo del título y el texto de la portada. */
export const MUESTRAS_PORTADA = [
  { nombre: "Blanco", hex: "#ffffff" },
  { nombre: "Gris claro", hex: "#f3f4f6" },
  { nombre: "Crema", hex: "#fff7ed" },
  { nombre: "Naranja", hex: "#ea580c" },
  { nombre: "Rojo", hex: "#b91c1c" },
  { nombre: "Azul", hex: "#1d4ed8" },
  { nombre: "Verde", hex: "#15803d" },
  { nombre: "Gris oscuro", hex: "#111827" },
  { nombre: "Negro", hex: "#0a0a0a" },
];

/** "#EA580C" o "ea580c" → "#ea580c". Vacío si no es un color válido. */
export function normalizarColor(texto: string): string {
  const v = texto.trim().toLowerCase().replace(/^#?/, "#");
  return /^#[0-9a-f]{6}$/.test(v) ? v : "";
}

function aRgb(hex: string): [number, number, number] {
  const n = parseInt((normalizarColor(hex) || COLOR_PRINCIPAL).slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla con blanco (t > 0) o negro (t < 0). */
function mezclar([r, g, b]: [number, number, number], t: number): string {
  const f = (c: number) => Math.round(t >= 0 ? c + (255 - c) * t : c * (1 + t));
  return `${f(r)} ${f(g)} ${f(b)}`;
}

/** Luminancia relativa (0 negro, 1 blanco). */
function luminancia([r, g, b]: [number, number, number]): number {
  const l = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}

/** true si sobre ese color se lee mejor el texto oscuro. */
export function esClaro(hex: string): boolean {
  return luminancia(aRgb(hex)) > 0.45;
}

/** Variables CSS de la tienda, para poner en el estilo de su contenedor. */
export function variablesTema(principal: string, encabezado: string): Record<string, string> {
  const p = aRgb(principal);
  const e = aRgb(encabezado || COLOR_ENCABEZADO);
  // Si el color principal es muy claro, los botones usan una versión más oscura para que se lean.
  const base = esClaro(principal) ? -0.35 : 0;
  return {
    "--marca-50": mezclar(p, 0.92),
    "--marca-100": mezclar(p, 0.82),
    "--marca-400": mezclar(p, base + 0.25),
    "--marca-500": mezclar(p, base + 0.1),
    "--marca-600": mezclar(p, base),
    "--marca-700": mezclar(p, base - 0.18),
    "--encabezado": mezclar(e, 0),
    "--encabezado-2": mezclar(e, esClaro(encabezado) ? -0.06 : 0.12),
    "--encabezado-texto": esClaro(encabezado) ? "17 24 39" : "255 255 255",
  };
}

/** Estilo de la franja del título de la portada: su color de fondo y un texto que se lea encima. */
export function estiloPortada(color: string): { backgroundColor: string; color: string } | undefined {
  const c = normalizarColor(color);
  if (!c) return undefined;
  return { backgroundColor: c, color: esClaro(c) ? "#111827" : "#ffffff" };
}
