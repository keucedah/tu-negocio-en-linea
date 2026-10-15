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

// --- Pedido con mototaxi (2.5) ---

type DatosMototaxi = {
  mototaxi: { nombre: string; codigo: string; numero: string; celular: string };
  cliente: string;
  direccionCliente: string;
  nota?: string;
  tienda: string;
  direccionTienda: string;
};

/** Productos con cantidad, precio, subtotal y total. */
function lineasConSubtotal(items: Linea[]) {
  const lineas = items.map((i) => {
    const nombre = `${i.cantidad} x ${i.nombre}${i.talla ? ` (talla ${i.talla})` : ""}`;
    if (i.precio == null) return `• ${nombre} (precio a consultar)`;
    return `• ${nombre}: ${lempiras(i.precio)} c/u = ${lempiras(Math.round(i.precio * i.cantidad * 100) / 100)}`;
  });
  const total = totalPedido(items);
  if (total) lineas.push("", `*${total.completo ? "Total" : "Total de los productos con precio"}: ${lempiras(total.monto)}*`);
  return lineas;
}

const fichaMototaxi = (m: DatosMototaxi["mototaxi"]) =>
  [m.nombre, m.codigo, m.numero && `mototaxi N.º ${m.numero}`, m.celular].filter(Boolean).join(" · ");

/** Mensaje que recibe el mototaxista: va a la tienda por los productos y los lleva al cliente. */
export function mensajeMototaxi(items: Linea[], d: DatosMototaxi) {
  const partes = [
    `Hola ${d.mototaxi.nombre}, soy *${d.cliente.trim()}*.`,
    `Quisiera que fuera por mis productos a la tienda *${d.tienda}*.`,
    "",
    `📍 Dirección de la tienda: ${d.direccionTienda || "pregunte en la tienda"}`,
    `🏠 Llevarlos a: ${d.direccionCliente.trim()}`,
    "",
    "Los productos son:",
    ...lineasConSubtotal(items),
  ];
  if (d.nota?.trim()) partes.push("", `Comentario: ${d.nota.trim()}`);
  partes.push("", "La tarifa del mototaxi la acordamos por aquí.", "", `🛺 Mototaxista: ${fichaMototaxi(d.mototaxi)}`, "", "¡Gracias por su servicio!");
  return partes.join("\n");
}

/** Aviso opcional a la tienda: el pedido lo recoge un mototaxista. */
export function mensajeTiendaMototaxi(items: Linea[], d: DatosMototaxi) {
  const partes = [
    `Hola, soy *${d.cliente.trim()}*. Hice este pedido y lo va a recoger el mototaxista *${d.mototaxi.nombre}* (${d.mototaxi.codigo}${d.mototaxi.numero ? `, mototaxi N.º ${d.mototaxi.numero}` : ""}).`,
    "",
    ...lineasConSubtotal(items),
  ];
  if (d.nota?.trim()) partes.push("", `Comentario: ${d.nota.trim()}`);
  partes.push("", "¿Me lo pueden tener listo, por favor? ¡Gracias!");
  return partes.join("\n");
}
