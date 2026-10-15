// Departamentos y municipios (2.5). Son públicos: se leen sin sesión y se guardan en caché.
import { unstable_cache } from "next/cache";
import { supabaseConfigurado } from "../config";
import { crearClientePublico } from "../supabase/publico";
import { SEGUNDOS_CACHE, TAG_PLATAFORMA } from "../cache";
import type { Ubicaciones } from "./types";

const ubicacionesPublicas = unstable_cache(
  async (): Promise<Ubicaciones> => {
    const sb = crearClientePublico();
    const [d, m] = await Promise.all([
      sb.from("departamentos").select("id, nombre").order("nombre"),
      sb.from("municipios").select("id, departamento_id, nombre").order("nombre"),
    ]);
    // Sin las tablas (falta el SQL de la 2.5) el panel sigue funcionando sin municipios
    if (d.error || m.error) return { departamentos: [], municipios: [] };
    return {
      departamentos: d.data.map((x) => ({ id: Number(x.id), nombre: x.nombre })),
      municipios: m.data.map((x) => ({ id: Number(x.id), departamento_id: Number(x.departamento_id), nombre: x.nombre })),
    };
  },
  ["ubicaciones"],
  { tags: [TAG_PLATAFORMA], revalidate: SEGUNDOS_CACHE },
);

export async function obtenerUbicaciones(): Promise<Ubicaciones> {
  if (!supabaseConfigurado) return { departamentos: [], municipios: [] };
  return ubicacionesPublicas();
}

/** "Langue, Valle" */
export function nombreMunicipio(id: number | null | undefined, u: Ubicaciones): string {
  const m = u.municipios.find((x) => x.id === id);
  if (!m) return "";
  const d = u.departamentos.find((x) => x.id === m.departamento_id);
  return d ? `${m.nombre}, ${d.nombre}` : m.nombre;
}

/** Para comparar nombres sin tildes ni mayúsculas ("Langue" = "langue" = "LANGÜE"). */
export function claveNombre(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
