/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import BotonAccion from "@/components/panel/BotonAccion";
import FormularioPublicidad from "@/components/panel/FormularioPublicidad";
import { alternarPublicidad, eliminarPublicidad } from "@/app/admin/acciones-publicidad";
import { obtenerPlanes, obtenerTipos } from "@/lib/panel/datos";
import { obtenerPublicidades, obtenerTiendasAnunciantes } from "@/lib/panel/publicidad";
import { nombreMunicipio, obtenerUbicaciones } from "@/lib/panel/ubicaciones";
import { fechaCorta, hoy, lempiras } from "@/lib/negocio";
import type { Publicidad } from "@/lib/panel/types";

function estado(p: Publicidad, h: string): { texto: string; clase: string } {
  if (!p.activo) return { texto: "Pausada", clase: "bg-gray-200 text-gray-700" };
  if (p.inicia && p.inicia > h) return { texto: `Empieza el ${fechaCorta(p.inicia)}`, clase: "bg-blue-100 text-blue-800" };
  if (p.termina && p.termina < h) return { texto: "Terminada", clase: "bg-gray-200 text-gray-700" };
  return { texto: "Se está mostrando", clase: "bg-green-100 text-green-800" };
}

export default async function PaginaPublicidad({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const [lista, tiendas, tipos, ubicaciones, planes] = await Promise.all([
    obtenerPublicidades(), obtenerTiendasAnunciantes(), obtenerTipos(), obtenerUbicaciones(), obtenerPlanes(),
  ]);

  if (lista === null) {
    return (
      <div className="tarjeta mx-auto max-w-xl text-center">
        <h1 className="text-xl font-bold">Publicidad</h1>
        <p className="mt-2 text-gray-600">
          Para usar esta sección, ejecuta primero <b>actualizacion-2.5.sql</b> en Supabase (proyecto <b>tu-negocio-en-linea</b>) y recarga la página.
        </p>
      </div>
    );
  }

  const enEdicion = editar ? lista.find((p) => p.id === Number(editar)) : undefined;
  const h = hoy();
  const conPublicidad = planes.filter((p) => p.con_publicidad).map((p) => p.nombre);
  const nombreTipo = (p: Publicidad) => p.tipo_negocio_otro || tipos.find((t) => t.id === p.tipo_negocio_id)?.nombre || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Publicidad</h1>
        <p className="text-gray-600">
          Una tienda (u otro negocio) te paga para anunciar una oferta o un producto. Sale debajo de “Lo más vendido”, con la etiqueta “Publicidad”, en las tiendas con plan{" "}
          <b>{conPublicidad.length ? conPublicidad.join(", ") : "con publicidad (márcalo en Planes)"}</b>, nunca en las del mismo tipo de negocio. Es aparte de tus anuncios y de los
          banners de cada tienda. No sale en la App.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="tarjeta lg:col-span-3">
          <h2 className="mb-3 text-lg font-bold">{enEdicion ? `Editar: ${enEdicion.titulo}` : "Nueva publicidad"}</h2>
          <FormularioPublicidad key={enEdicion?.id ?? "nueva"} publicidad={enEdicion} tiendas={tiendas} tipos={tipos} ubicaciones={ubicaciones} />
        </section>

        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold">Tus publicidades ({lista.length})</h2>
          {lista.length === 0 && <p className="tarjeta text-sm text-gray-600">Todavía no hay publicidad.</p>}
          {lista.map((p) => {
            const e = estado(p, h);
            const tipo = nombreTipo(p);
            const municipio = nombreMunicipio(p.municipio_id, ubicaciones);
            return (
              <article key={p.id} className={`tarjeta space-y-2 ${enEdicion?.id === p.id ? "ring-2 ring-orange-400" : ""}`}>
                <div className="flex gap-3">
                  <img src={p.imagen_url} alt="" className="aspect-video w-28 shrink-0 rounded-lg bg-gray-100 object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.titulo}</p>
                    <p className="truncate text-xs text-gray-600">{p.anunciante_nombre}{tipo && ` · ${tipo}`}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${e.clase}`}>{e.texto}</span>
                    <p className="mt-1 text-xs text-gray-500">
                      {municipio ? `Solo en ${municipio}` : "Todas las tiendas"}
                      {tipo && ` menos ${tipo}`}
                      {p.precio != null && ` · Cobrado ${lempiras(p.precio)}`}
                    </p>
                    {(p.inicia || p.termina) && (
                      <p className="text-xs text-gray-500">
                        {p.inicia ? `Del ${fechaCorta(p.inicia)}` : "Desde ya"} {p.termina ? `al ${fechaCorta(p.termina)}` : "sin fecha de fin"}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-gray-700">
                      {p.vistas.toLocaleString("es-HN")} vistas · {p.clics.toLocaleString("es-HN")} clics
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-3 text-sm">
                  <Link href={`/admin/publicidad?editar=${p.id}`} className="font-medium text-marino-700 hover:underline">Editar</Link>
                  <BotonAccion accion={alternarPublicidad.bind(null, p.id, !p.activo)} className="text-sm font-medium text-gray-700 hover:underline">
                    {p.activo ? "Pausar" : "Activar"}
                  </BotonAccion>
                  <BotonAccion accion={eliminarPublicidad.bind(null, p.id)} confirmacion={`¿Eliminar la publicidad “${p.titulo}”?`}>
                    Eliminar
                  </BotonAccion>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
