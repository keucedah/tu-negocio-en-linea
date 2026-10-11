import { revalidateTag } from "next/cache";

// Etiquetas de la caché de datos públicos. Lo que ve el visitante se guarda unos minutos
// y se borra en cuanto el dueño o el administrador guarda un cambio.
export const TAG_CATALOGO = "catalogo";
export const TAG_PLATAFORMA = "plataforma";
// Por si un cambio se hace fuera de la plataforma (directo en Supabase): máximo de segundos guardado.
export const SEGUNDOS_CACHE = 300;

/** Borra la caché pública después de guardar un cambio. */
export function refrescarCache() {
  revalidateTag(TAG_CATALOGO);
  revalidateTag(TAG_PLATAFORMA);
}
