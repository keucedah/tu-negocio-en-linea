import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

/**
 * Cliente sin sesión (clave pública) para lo que ve cualquier visitante: tiendas, catálogo, planes.
 * No lee cookies, así esas consultas se pueden guardar en caché y compartir entre visitantes.
 */
export function crearClientePublico() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
