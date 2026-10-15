// Solo en el servidor: deja una imagen en WebP con el lado más largo de `lado` píxeles.
// El navegador ya la manda optimizada; aquí se asegura (por ejemplo, iPhone manda JPG).
export async function aWebp(archivo: File, lado: number): Promise<Buffer> {
  const original = Buffer.from(await archivo.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(original)
      .rotate()
      .resize({ width: lado, height: lado, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    if (archivo.type === "image/webp") return original;
    throw new Error("No se pudo convertir la imagen a WebP. Prueba con otra imagen.");
  }
}

/** Revisa que sea una imagen de menos de 5 MB. Devuelve el error o null. */
export function revisarImagen(archivo: File | null, nombre = "La imagen"): string | null {
  if (!archivo) return null;
  if (!archivo.type.startsWith("image/")) return `${nombre} debe ser una imagen.`;
  if (archivo.size > 5 * 1024 * 1024) return `${nombre} debe pesar menos de 5 MB.`;
  return null;
}

/** Archivo de un campo del formulario; null si viene vacío. */
export function archivoDe(f: FormData, k: string): File | null {
  const v = f.get(k);
  return v instanceof File && v.size > 0 ? v : null;
}
