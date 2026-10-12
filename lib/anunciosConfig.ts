// Medidas de los anuncios (se usan en el formulario, al subir y en el carrusel).
export const MAX_IMAGENES_ANUNCIO = 4;
/** Lado más largo de cada imagen al guardarla (px). */
export const LADO_ANUNCIO = 1600;
/** Medida recomendada que se muestra al crear un anuncio. */
export const MEDIDA_RECOMENDADA = "1600 × 900 px (horizontal 16:9)";

/** Saca el código de un video de YouTube (youtube.com/watch?v=, youtu.be/, shorts/, embed/). */
export function idYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}
