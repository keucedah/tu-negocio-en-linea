import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/config";

/**
 * Cliente con la clave de servicio: salta las reglas RLS.
 * Solo se usa en acciones del servidor, después de comprobar que quien pide es administrador del panel.
 */
export function crearClienteServicio() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
