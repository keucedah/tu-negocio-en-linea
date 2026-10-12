/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import BotonAccion from "@/components/panel/BotonAccion";
import FormularioAnuncio from "@/components/panel/FormularioAnuncio";
import { alternarAnuncio, eliminarAnuncio } from "@/app/admin/acciones-anuncios";
import { obtenerAnuncios, obtenerTiendasLista } from "@/lib/panel/datos";
import { idYoutube } from "@/lib/anunciosConfig";
import { fechaCorta, hoy } from "@/lib/negocio";
import type { Anuncio } from "@/lib/panel/types";

function estado(a: Anuncio, h: string): { texto: string; clase: string } {
  if (!a.activo) return { texto: "Pausado", clase: "bg-gray-200 text-gray-700" };
  if (a.inicia && a.inicia > h) return { texto: `Empieza el ${fechaCorta(a.inicia)}`, clase: "bg-blue-100 text-blue-800" };
  if (a.termina && a.termina < h) return { texto: "Terminado", clase: "bg-gray-200 text-gray-700" };
  return { texto: "Se está mostrando", clase: "bg-green-100 text-green-800" };
}

export default async function Anuncios({ searchParams }: { searchParams: Promise<{ editar?: string }> }) {
  const { editar } = await searchParams;
  const [anuncios, tiendas] = await Promise.all([obtenerAnuncios(), obtenerTiendasLista()]);
  const nombreTienda = new Map(tiendas.map((t) => [t.id, t.nombre]));
  const enEdicion = editar ? anuncios.find((a) => a.id === Number(editar)) : undefined;
  const h = hoy();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Anuncios</h1>
        <p className="text-gray-600">
          Sorteos, regalías y promociones. Salen en un carrusel debajo de la portada, en las tiendas de tus clientes y en tu página principal. No salen en la App.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="tarjeta lg:col-span-3">
          <h2 className="mb-3 text-lg font-bold">{enEdicion ? `Editar: ${enEdicion.titulo}` : "Nuevo anuncio"}</h2>
          <FormularioAnuncio key={enEdicion?.id ?? "nuevo"} anuncio={enEdicion} tiendas={tiendas} />
        </section>

        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold">Tus anuncios ({anuncios.length})</h2>
          {anuncios.length === 0 && <p className="tarjeta text-sm text-gray-600">Todavía no hay anuncios.</p>}
          {anuncios.map((a) => {
            const e = estado(a, h);
            const yt = a.video_url ? idYoutube(a.video_url) : null;
            const miniatura = a.imagenes[0] ?? (yt ? `https://i.ytimg.com/vi/${yt}/mqdefault.jpg` : null);
            return (
              <article key={a.id} className={`tarjeta space-y-2 ${enEdicion?.id === a.id ? "ring-2 ring-orange-400" : ""}`}>
                <div className="flex gap-3">
                  <div className="grid aspect-video w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-xs text-gray-500">
                    {miniatura ? <img src={miniatura} alt="" className="h-full w-full object-cover" /> : "Video"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{a.titulo}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${e.clase}`}>{e.texto}</span>
                    <p className="mt-1 text-xs text-gray-500">
                      {a.video_url ? "Video" : `${a.imagenes.length} imagen${a.imagenes.length === 1 ? "" : "es"}`}
                      {" · "}
                      {a.tiendas.length === 0 ? "Todas las tiendas" : a.tiendas.map((id) => nombreTienda.get(id) ?? "Tienda eliminada").join(", ")}
                      {a.en_inicio && " y tu página principal"}
                    </p>
                    {(a.inicia || a.termina) && (
                      <p className="text-xs text-gray-500">
                        {a.inicia ? `Del ${fechaCorta(a.inicia)}` : "Desde ya"} {a.termina ? `al ${fechaCorta(a.termina)}` : "sin fecha de fin"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-start gap-3 text-sm">
                  <Link href={`/admin/anuncios?editar=${a.id}`} className="font-medium text-marino-700 hover:underline">
                    Editar
                  </Link>
                  <BotonAccion accion={alternarAnuncio.bind(null, a.id, !a.activo)} className="text-sm font-medium text-gray-700 hover:underline">
                    {a.activo ? "Pausar" : "Activar"}
                  </BotonAccion>
                  <BotonAccion accion={eliminarAnuncio.bind(null, a.id)} confirmacion={`¿Eliminar el anuncio “${a.titulo}”? Se borran también sus imágenes.`}>
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
