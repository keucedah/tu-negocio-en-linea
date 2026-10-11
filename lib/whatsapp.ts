type Linea = { nombre: string; cantidad: number };

export function mensajeCotizacion(items: Linea[], cliente?: { nombre?: string; nota?: string }) {
  const lineas = items.map((i) => `• ${i.cantidad} x ${i.nombre}`);
  const partes = ["Hola, me interesan estos productos:", "", ...lineas];
  if (cliente?.nombre?.trim()) partes.push("", `Mi nombre: ${cliente.nombre.trim()}`);
  if (cliente?.nota?.trim()) partes.push("", `Comentario: ${cliente.nota.trim()}`);
  return partes.join("\n");
}

export function enlaceWhatsApp(numero: string, texto: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
