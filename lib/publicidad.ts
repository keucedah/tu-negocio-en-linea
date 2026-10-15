// Publicidad pagada que se ve en una tienda (2.5). La base de datos decide dónde sale:
// solo en tiendas con plan con publicidad, nunca en las del mismo tipo de negocio ni en la anunciante.
import { unstable_cache } from "next/cache";
import { supabaseConfigurado } from "./config";
import { crearClientePublico } from "./supabase/publico";
import { SEGUNDOS_CACHE, TAG_PLATAFORMA } from "./cache";
import { urlTienda } from "./seo";

export type PublicidadPublica = {
  id: number;
  anunciante: string;
  titulo: string;
  texto: string;
  imagen: string;
  enlace: string;
  boton: string;
};

type Fila = {
  id: number;
  anunciante_nombre: string;
  titulo: string;
  texto: string;
  imagen_url: string;
  enlace_url: string;
  boton_texto: string;
  slug: string | null;
  dominio: string | null;
};

const deTienda = unstable_cache(
  async (tiendaId: number): Promise<PublicidadPublica[]> => {
    const { data, error } = await crearClientePublico().rpc("publicidad_de_tienda", { t: tiendaId });
    if (error || !data) return []; // Sin el SQL de la 2.5 la tienda sigue igual
    return (data as Fila[])
      .map((p) => ({
        id: Number(p.id),
        anunciante: p.anunciante_nombre,
        titulo: p.titulo,
        texto: p.texto,
        imagen: p.imagen_url,
        // Sin enlace propio: abre la tienda del anunciante
        enlace: p.enlace_url || (p.slug ? urlTienda({ slug: p.slug, dominio: p.dominio }) : ""),
        boton: p.boton_texto,
      }))
      .filter((p) => p.enlace);
  },
  ["publicidad-tienda"],
  { tags: [TAG_PLATAFORMA], revalidate: SEGUNDOS_CACHE },
);

export async function obtenerPublicidad(tiendaId: number): Promise<PublicidadPublica[]> {
  if (!supabaseConfigurado) return [];
  return deTienda(tiendaId);
}
