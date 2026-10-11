import { lempiras } from "./precio";

type Linea = { nombre: string; cantidad: number; precio?: number | null; talla?: string | null };

/** Suma de los productos que tienen precio. null si ninguno tiene. */
export function totalPedido(items: Linea[]) {
  const conPrecio = items.filter((i) => i.precio != null);
  if (conPrecio.length === 0) return null;
  const monto = Math.round(conPrecio.reduce((s, i) => s + (i.precio as number) * i.cantidad, 0) * 100) / 100;
  return { monto, completo: conPrecio.length === items.length };
}

export function mensajeCotizacion(items: Linea[], cliente?: { nombre?: string; nota?: string }) {
  const lineas = items.map((i) => `• ${i.cantidad} x ${i.nombre}${i.talla ? ` (talla ${i.talla})` : ""}${i.precio != null ? ` (${lempiras(i.precio)} c/u)` : ""}`);
  const partes = ["Hola, me interesan estos productos:", "", ...lineas];
  const total = totalPedido(items);
  if (total) partes.push("", `${total.completo ? "Total" : "Total de los productos con precio"}: ${lempiras(total.monto)}`);
  if (cliente?.nombre?.trim()) partes.push("", `Mi nombre: ${cliente.nombre.trim()}`);
  if (cliente?.nota?.trim()) partes.push("", `Comentario: ${cliente.nota.trim()}`);
  return partes.join("\n");
}

export function enlaceWhatsApp(numero: string, texto: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
