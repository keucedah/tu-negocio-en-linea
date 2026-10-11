// Se usa en el navegador antes de subir una foto: la reduce y la pasa a WebP.
// Una foto de celular de 3 MB queda en unos cientos de KB sin que se note la diferencia.

const CALIDAD = 0.82;

async function abrir(archivo: File): Promise<{ img: CanvasImageSource; ancho: number; alto: number; cerrar: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(archivo, { imageOrientation: "from-image" });
      return { img: bmp, ancho: bmp.width, alto: bmp.height, cerrar: () => bmp.close() };
    } catch {
      // Algunos navegadores no aceptan opciones: se intenta con <img>
    }
  }
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { img, ancho: img.naturalWidth, alto: img.naturalHeight, cerrar: () => URL.revokeObjectURL(url) };
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((r) => canvas.toBlob(r, tipo, CALIDAD));
}

/**
 * Devuelve la foto en WebP con el lado más largo de `maximo` píxeles como mucho.
 * Si el navegador no puede hacer WebP usa JPG (o PNG si la foto tiene transparencia).
 * Si algo falla, o el resultado pesa más que la original, devuelve la original.
 */
export async function optimizarImagen(archivo: File, maximo = 1200): Promise<File> {
  if (!archivo.type.startsWith("image/")) return archivo;
  let abierta;
  try {
    abierta = await abrir(archivo);
  } catch {
    return archivo;
  }
  try {
    const escala = Math.min(1, maximo / Math.max(abierta.ancho, abierta.alto));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(abierta.ancho * escala));
    canvas.height = Math.max(1, Math.round(abierta.alto * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(abierta.img, 0, 0, canvas.width, canvas.height);

    let blob = await aBlob(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") {
      // Navegadores viejos sin WebP: JPG para fotos, PNG para logos transparentes
      const tipo = archivo.type === "image/png" || archivo.type === "image/gif" ? "image/png" : "image/jpeg";
      blob = await aBlob(canvas, tipo);
    }
    if (!blob) return archivo;
    if (blob.size >= archivo.size && escala === 1 && archivo.type !== "image/gif") return archivo;

    const ext = blob.type.split("/")[1].replace("jpeg", "jpg");
    const nombre = archivo.name.replace(/\.[^.]*$/, "") + "." + ext;
    return new File([blob], nombre, { type: blob.type });
  } catch {
    return archivo;
  } finally {
    abierta.cerrar();
  }
}

export function formatoPeso(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Optimiza la foto elegida y la deja en el mismo campo del formulario,
 * así el formulario envía la versión liviana. Devuelve el archivo final.
 */
export async function optimizarCampo(input: HTMLInputElement, maximo?: number): Promise<File | null> {
  const original = input.files?.[0];
  if (!original) return null;
  const listo = await optimizarImagen(original, maximo);
  if (listo !== original && typeof DataTransfer !== "undefined") {
    try {
      const dt = new DataTransfer();
      dt.items.add(listo);
      input.files = dt.files;
    } catch {
      return original;
    }
  }
  return input.files?.[0] ?? original;
}
