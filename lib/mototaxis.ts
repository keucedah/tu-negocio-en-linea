// Mototaxistas que ve el cliente en el carrito de una tienda (2.5). Sin la identidad.
import { unstable_cache } from "next/cache";
import { supabaseConfigurado } from "./config";
import { crearClientePublico } from "./supabase/publico";
import { SEGUNDOS_CACHE, TAG_PLATAFORMA } from "./cache";
import { formatearCelular, numeroWhatsApp } from "./telefono";

export type MototaxiPublico = {
  id: number;
  codigo: string;
  nombre: string;
  /** Número para wa.me y como se muestra. */
  whatsapp: string;
  celular: string;
  direccion: string;
  numero: string;
  foto: string | null;
  fotoMoto: string | null;
  /** Mensualidad vencida: sale al final, en gris, y no se puede elegir. */
  suspendido: boolean;
};

type Fila = {
  id: number;
  codigo: string;
  nombre: string;
  codigo_pais: string;
  celular: string;
  direccion: string;
  numero_mototaxi: string;
  foto_url: string | null;
  foto_moto_url: string | null;
  suspendido: boolean;
};

const deTienda = unstable_cache(
  async (tiendaId: number): Promise<MototaxiPublico[]> => {
    const { data, error } = await crearClientePublico().rpc("mototaxis_de_tienda", { t: tiendaId });
    if (error || !data) return []; // Sin el SQL de la 2.5 el carrito funciona como antes
    return (data as Fila[]).map((m) => ({
      id: Number(m.id),
      codigo: m.codigo,
      nombre: m.nombre,
      whatsapp: numeroWhatsApp(m.codigo_pais, m.celular),
      celular: formatearCelular(m.codigo_pais, m.celular),
      direccion: m.direccion,
      numero: m.numero_mototaxi,
      foto: m.foto_url,
      fotoMoto: m.foto_moto_url,
      suspendido: m.suspendido,
    }));
  },
  ["mototaxis-tienda"],
  // Se guarda poco tiempo: un pago o un vencimiento se nota pronto en las tiendas
  { tags: [TAG_PLATAFORMA], revalidate: Math.min(SEGUNDOS_CACHE, 120) },
);

export async function obtenerMototaxis(tiendaId: number): Promise<MototaxiPublico[]> {
  if (!supabaseConfigurado) return [];
  return deTienda(tiendaId);
}
