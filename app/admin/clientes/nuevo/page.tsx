import Link from "next/link";
import FormularioCliente from "@/components/panel/FormularioCliente";
import { obtenerAjustes, obtenerPlanes, obtenerTipos } from "@/lib/panel/datos";
import { hoy, sumarMeses } from "@/lib/negocio";
import { claveAleatoria } from "@/lib/clave";
import { servicioConfigurado, supabaseConfigurado } from "@/lib/config";
import { urlSitio } from "@/lib/url";
import { obtenerUbicaciones } from "@/lib/panel/ubicaciones";

// Se puede abrir con datos: /admin/clientes/nuevo?negocio=…&contacto=…&celular=… (desde Solicitudes)
export const dynamic = "force-dynamic";

export default async function NuevoCliente({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const [planes, ajustes, tipos, ubicaciones] = await Promise.all([obtenerPlanes(), obtenerAjustes(), obtenerTipos(), obtenerUbicaciones()]);
  const h = hoy();
  const puedeCrearTienda = servicioConfigurado || !supabaseConfigurado;
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Volver a clientes</Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Agregar cliente</h1>
      <div className="tarjeta">
        <FormularioCliente
          cliente={{ negocio: q.negocio ?? "", contacto: q.contacto ?? "", celular: q.celular?.replace(/\D/g, "").replace(/^504(?=\d{8}$)/, "") ?? "" }}
          planes={planes}
          tipos={tipos}
          ubicaciones={ubicaciones}
          precioDominio={ajustes.precio_dominio}
          hoy={h}
          proximoSugerido={sumarMeses(h, 1)}
          tienda={puedeCrearTienda ? { claveSugerida: claveAleatoria(), urlTiendas: await urlSitio() } : undefined}
        />
        {!puedeCrearTienda && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Para crear la tienda del cliente desde aquí, agrega la variable <b>SUPABASE_SERVICE_ROLE_KEY</b> en Vercel (ver README).
          </p>
        )}
      </div>
    </div>
  );
}
