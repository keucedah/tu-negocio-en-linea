/** Precio en lempiras: "L 150" o "L 1,250.50". */
export function lempiras(n: number): string {
  return "L " + n.toLocaleString("es-HN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

/** Lee el precio que escribió el dueño ("1,250.50", "150"). Vacío o inválido = sin precio. */
export function leerPrecio(texto: string): number | null | "invalido" {
  const limpio = texto.replace(/[L\s,]/gi, "");
  if (!limpio) return null;
  const n = Number(limpio);
  if (!Number.isFinite(n) || n < 0 || n > 9_999_999_999) return "invalido";
  return Math.round(n * 100) / 100;
}
