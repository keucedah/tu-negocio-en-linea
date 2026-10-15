/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Simbolo } from "@/components/Marca";
import { crearClientePublico } from "@/lib/supabase/publico";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerAjustes } from "@/lib/panel/datos";
import { diasHasta, fechaCorta, hoy, lempiras } from "@/lib/negocio";
import { numeroWhatsApp } from "@/lib/telefono";

export const dynamic = "force-dynamic";
// Página privada: no sale en Google y el enlace no se pasa a otras páginas
export const metadata: Metadata = { title: "Mi página de mototaxista", robots: { index: false, follow: false }, referrer: "no-referrer" };

type Datos = {
  codigo: string;
  nombre: string;
  foto_url: string | null;
  numero_mototaxi: string;
  municipio: string;
  pagado_hasta: string | null;
  activo: boolean;
  acepto_publicar: boolean;
  cuota: number;
};

export default async function PaginaMototaxista({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!supabaseConfigurado || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) notFound();
  const [{ data }, ajustes] = await Promise.all([
    crearClientePublico().rpc("mototaxista_por_token", { p_token: token }),
    obtenerAjustes(),
  ]);
  const m = (data as Datos[] | null)?.[0];
  if (!m) notFound();

  const dias = m.pagado_hasta ? diasHasta(m.pagado_hasta, hoy()) : -1;
  const vencido = !m.pagado_hasta || dias < 0;
  const porVencer = !vencido && dias <= ajustes.dias_aviso;
  const admin = numeroWhatsApp(ajustes.codigo_pais, ajustes.celular);
  const mensaje = `Hola, soy ${m.nombre} (${m.codigo}), mototaxista. Quiero realizar mi pago mensual de ${lempiras(Number(m.cuota))}.`;

  let estado: { titulo: string; texto: string; clase: string };
  if (!m.activo) estado = { titulo: "Dado de baja", texto: "Ya no sales en las tiendas. Si quieres volver, escríbenos.", clase: "bg-gray-100 text-gray-800" };
  else if (!m.acepto_publicar) estado = { titulo: "Pendiente", texto: "Falta tu permiso para publicar tus datos en las tiendas. Escríbenos para activarte.", clase: "bg-orange-100 text-orange-900" };
  else if (vencido)
    estado = {
      titulo: "Suspendido",
      texto: m.pagado_hasta ? `Tu mensualidad venció el ${fechaCorta(m.pagado_hasta)}. Sales en gris en las tiendas y los clientes no te pueden elegir.` : "Todavía no tenemos tu primer pago. Sales en gris en las tiendas y los clientes no te pueden elegir.",
      clase: "bg-red-100 text-red-900",
    };
  else if (porVencer)
    estado = { titulo: "Activo · por vencer", texto: dias === 0 ? "Tu mensualidad vence hoy." : `Tu mensualidad vence en ${dias} día${dias === 1 ? "" : "s"}.`, clase: "bg-yellow-100 text-yellow-900" };
  else estado = { titulo: "Activo", texto: "Estás al día y los clientes te pueden elegir en las tiendas.", clase: "bg-green-100 text-green-900" };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-marino-900 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Simbolo className="h-9 w-9 shrink-0" />
          <p className="font-bold">{ajustes.nombre_negocio}</p>
        </div>
      </header>
      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <section className="tarjeta text-center">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-gray-100 ring-4 ring-white shadow">
            {m.foto_url ? <img src={m.foto_url} alt={m.nombre} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-5xl">🛺</span>}
          </div>
          <h1 className="mt-3 text-2xl font-black">{m.nombre}</h1>
          <p className="text-gray-600">
            {m.codigo}
            {m.numero_mototaxi && ` · Mototaxi N.º ${m.numero_mototaxi}`}
          </p>
          {m.municipio && <p className="text-sm text-gray-500">{m.municipio}</p>}
        </section>

        <section className={`rounded-2xl p-5 text-center ${estado.clase}`}>
          <p className="text-xs font-bold uppercase tracking-wide opacity-70">Tu estado</p>
          <p className="text-3xl font-black">{estado.titulo}</p>
          <p className="mt-1 text-sm">{estado.texto}</p>
        </section>

        <section className="tarjeta">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-gray-500">Pagado hasta</dt><dd className="text-lg font-bold">{fechaCorta(m.pagado_hasta)}</dd></div>
            <div><dt className="text-gray-500">Mensualidad</dt><dd className="text-lg font-bold">{lempiras(Number(m.cuota))}</dd></div>
          </dl>
          <p className="mt-4 rounded-xl bg-marca-50 px-3 py-2 text-center text-sm font-semibold text-marca-700">
            Realiza tu pago para seguir visible en las tiendas.
          </p>
          {admin && (
            <a href={`https://wa.me/${admin}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noopener noreferrer" className="boton-whatsapp mt-3 w-full py-3 text-center text-base">
              Escribir al administrador por WhatsApp
            </a>
          )}
        </section>
        <p className="text-center text-xs text-gray-500">Este enlace es solo tuyo. No lo compartas.</p>
      </main>
    </div>
  );
}
