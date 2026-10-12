/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Catalogo from "@/components/tienda/Catalogo";
import Anuncios from "@/components/tienda/Anuncios";
import Banners from "@/components/tienda/Banners";
import { estiloPortada } from "@/lib/tema";
import Destacados from "@/components/tienda/Destacados";
import NoDisponible from "@/components/tienda/NoDisponible";
import { leerFiltros, obtenerPaginaCatalogo, obtenerTiendaPublica as obtenerTienda } from "@/lib/tienda/datos";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerAnunciosTienda } from "@/lib/anuncios";

export const dynamic = "force-dynamic";

// Días que un producto lleva la etiqueta "Nuevo" desde que se sube
const DIAS_NUEVO = 7;

export default async function Inicio({
  params,
  searchParams,
}: {
  params: Promise<{ tienda: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) notFound();
  if (!tienda.activa) return <NoDisponible nombre={tienda.nombre} />;
  const [catalogo, anuncios] = await Promise.all([
    obtenerPaginaCatalogo(tienda.id, leerFiltros(await searchParams)),
    obtenerAnunciosTienda(tienda.id),
  ]);
  // Lista y carrusel con la foto pequeña (si el producto la tiene); la grande queda para la ficha
  const ahora = Date.now();
  const esNuevo = (creado: string) => ahora - Date.parse(creado) < DIAS_NUEVO * 86_400_000;
  const top = catalogo.destacados.map((p) => ({ ...p, imagen_url: p.imagen_mini_url || p.imagen_url, nuevo: esNuevo(p.creado_en) }));
  // A la lista solo van los datos que muestra (la descripción ya sale cortada a 2 líneas)
  const productos = catalogo.productos.map(({ id, nombre, descripcion, categoria_id, imagen_url, imagen_mini_url, precio, tallas, creado_en }) => ({
    id, nombre, categoria_id, creado_en, precio, tallas, nuevo: esNuevo(creado_en),
    imagen_url: imagen_mini_url || imagen_url,
    descripcion: descripcion.length > 140 ? descripcion.slice(0, 137).trimEnd() + "…" : descripcion,
  }));

  return (
    <>
      {/* Portada: hasta 3 banners en carrusel (4:1, siempre completos con cualquier pantalla o zoom).
          El título y el texto van debajo, sobre el color que elija el dueño, para no tapar la imagen. */}
      {tienda.banners.length > 0 && <Banners banners={tienda.banners} nombre={tienda.nombre} />}
      <section className="relative overflow-hidden bg-encabezado text-encabezado-texto" style={estiloPortada(tienda.colorPortada)}>
        {!tienda.colorPortada && <div className="absolute inset-0 bg-gradient-to-r from-encabezado to-encabezado-2" />}
        <div className={`relative mx-auto max-w-6xl px-4 ${tienda.banners.length ? "py-6" : "py-10"}`}>
          <h1 className="max-w-2xl text-2xl font-bold sm:text-4xl">{tienda.tituloPortada}</h1>
          <p className="mt-2 max-w-xl opacity-80">{tienda.textoPortada}</p>
        </div>
      </section>
      {!supabaseConfigurado && (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          Modo demostración: se muestran productos de ejemplo hasta conectar la base de datos.
        </p>
      )}
      {/* Anuncios de la plataforma (sorteos, promociones): no salen en la App */}
      <Anuncios anuncios={anuncios.anuncios} whatsapp={anuncios.whatsapp} origen={`la tienda ${tienda.nombre}`} />
      {top.length > 0 && <Destacados productos={top} />}
      {/* El alto mínimo evita que el pie de página salte cuando llega la lista (CLS) */}
      <Suspense fallback={<div className="min-h-screen" />}>
        <Catalogo
          categorias={catalogo.categorias}
          conteo={catalogo.conteo}
          total={catalogo.total}
          productos={productos}
          encontrados={catalogo.encontrados}
          filtros={catalogo.filtros}
          placeholder={tienda.textoBuscador}
        />
      </Suspense>
    </>
  );
}
