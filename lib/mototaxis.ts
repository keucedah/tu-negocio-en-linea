// Mototaxistas que ve el cliente en el carrito de una tienda (2.5, 2.6). Sin la identidad.
// Los suspendidos no salen. Los ocupados salen marcados "Ocupado" y no se pueden elegir.
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
  /** Se puso Ocupado en su App: sale al final, en gris, y no se puede elegir. */
  ocupado: boolean;
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
  /** Desde la 2.6. Antes, "suspendido" era la mensualidad vencida. */
  ocupado?: boolean;
};

const deTienda = unstable_cache(
  async (tiendaId: number): Promise<MototaxiPublico[]> => {
    const { data, error } = await crearClientePublico().rpc("mototaxis_de_tienda", { t: tiendaId });
    if (error || !data) return []; // Sin el SQL de la 2.5 el carrito funciona como antes
    const filas = data as Fila[];
    // Sin el SQL de la 2.6, "suspendido" es la mensualidad vencida: esos no salen.
    const con26 = filas.some((m) => typeof m.ocupado === "boolean");
    return filas.filter((m) => con26 || !m.suspendido).map((m) => ({
      id: Number(m.id),
      codigo: m.codigo,
      nombre: m.nombre,
      whatsapp: numeroWhatsApp(m.codigo_pais, m.celular),
      celular: formatearCelular(m.codigo_pais, m.celular),
      direccion: m.direccion,
      numero: m.numero_mototaxi,
      foto: m.foto_url,
      fotoMoto: m.foto_moto_url,
      ocupado: con26 ? Boolean(m.ocupado) : false,
    }));
  },
  ["mototaxis-tienda"],
  // Se guarda muy poco tiempo: Ocupado/Disponible, un pago o un vencimiento se notan pronto en las tiendas
  { tags: [TAG_PLATAFORMA], revalidate: Math.min(SEGUNDOS_CACHE, 60) },
);

export async function obtenerMototaxis(tiendaId: number): Promise<MototaxiPublico[]> {
  if (!supabaseConfigurado) return [];
  return deTienda(tiendaId);
}
