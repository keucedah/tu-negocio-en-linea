// En el navegador: arma una imagen con los datos del mototaxista elegido, para que el cliente
// la guarde como comprobante (foto, nombre, código, número de mototaxi y su mototaxi).
import type { MototaxiPublico } from "./mototaxis";

const ANCHO = 1080;
const ALTO = 1350;

function cargar(src: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((r) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Para poder guardar la imagen con la foto
    img.onload = () => r(img);
    img.onerror = () => r(null);
    img.src = src;
    setTimeout(() => r(null), 8000);
  });
}

/** Dibuja la imagen como "cover" dentro del rectángulo. */
function cubrir(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const e = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / e;
  const sh = h / e;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function redondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Texto centrado que se achica si no cabe. */
function texto(ctx: CanvasRenderingContext2D, t: string, y: number, tam: number, peso: string, color: string, maximo = ANCHO - 120) {
  let size = tam;
  ctx.font = `${peso} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  while (ctx.measureText(t).width > maximo && size > 20) {
    size -= 2;
    ctx.font = `${peso} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(t, ANCHO / 2, y);
}

function dibujar(
  ctx: CanvasRenderingContext2D,
  m: MototaxiPublico,
  d: { tienda: string; color: string; cliente: string; total: string },
  foto: HTMLImageElement | null,
  moto: HTMLImageElement | null,
) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Franja con el color de la tienda
  ctx.fillStyle = d.color;
  ctx.fillRect(0, 0, ANCHO, 300);
  texto(ctx, "PEDIDO CON MOTOTAXI", 90, 38, "700", "rgba(255,255,255,0.85)");
  texto(ctx, d.tienda, 160, 58, "800", "#ffffff");

  // Foto del mototaxista en círculo
  const cx = ANCHO / 2;
  const cy = 400;
  const r = 165;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#e5e7eb";
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  if (foto) cubrir(ctx, foto, cx - r, cy - r, r * 2, r * 2);
  else texto(ctx, "🛺", cy + 50, 140, "400", "#6b7280");
  ctx.restore();

  texto(ctx, m.nombre, 655, 64, "800", "#111827");
  texto(ctx, [m.codigo, m.numero && `Mototaxi N.º ${m.numero}`].filter(Boolean).join("  ·  "), 720, 40, "600", "#374151");
  if (m.celular) texto(ctx, `WhatsApp ${m.celular}`, 772, 36, "500", "#4b5563");

  // Foto de la mototaxi
  const fx = 200;
  const fy = 810;
  const fw = ANCHO - 400;
  const fh = 330;
  ctx.save();
  redondeado(ctx, fx, fy, fw, fh, 28);
  ctx.clip();
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(fx, fy, fw, fh);
  if (moto) cubrir(ctx, moto, fx, fy, fw, fh);
  else texto(ctx, "Sin foto de la mototaxi", fy + fh / 2 + 12, 32, "500", "#9ca3af");
  ctx.restore();

  // Pie: cliente, total y fecha
  const ahora = new Date().toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
  texto(ctx, [d.cliente && `Cliente: ${d.cliente}`, d.total && `Total: ${d.total}`].filter(Boolean).join("  ·  "), 1215, 34, "600", "#111827");
  texto(ctx, ahora, 1268, 30, "400", "#6b7280");
  ctx.fillStyle = d.color;
  ctx.fillRect(0, ALTO - 24, ANCHO, 24);
}

/** Imagen JPG con la ficha del mototaxista. null si el navegador no puede hacerla. */
export async function crearFichaMototaxi(
  m: MototaxiPublico,
  d: { tienda: string; color: string; cliente: string; total: string },
): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = ANCHO;
    canvas.height = ALTO;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const [foto, moto] = await Promise.all([cargar(m.foto), cargar(m.fotoMoto)]);
    dibujar(ctx, m, d, foto, moto);
    try {
      return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    } catch {
      // Si una foto no dejó guardar la imagen (servidor sin permiso), se hace sin fotos
      dibujar(ctx, m, d, null, null);
      return await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    }
  } catch {
    return null;
  }
}

/** Descarga la imagen en el celular o la computadora. */
export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
