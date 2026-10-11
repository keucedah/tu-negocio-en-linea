/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Catalogo from "@/components/tienda/Catalogo";
import Destacados from "@/components/tienda/Destacados";
import NoDisponible from "@/components/tienda/NoDisponible";
import { destacados, obtenerCatalogo, obtenerTienda } from "@/lib/tienda/datos";
import { supabaseConfigurado } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Inicio({ params }: { params: Promise<{ tienda: string }> }) {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) notFound();
  if (!tienda.activa) return <NoDisponible nombre={tienda.nombre} />;
  const { categorias, productos } = await obtenerCatalogo(tienda.id);
  const top = destacados(productos);

  return (
    <>
      {/* Portada: banner del dueño (o el color de su encabezado) con su título y texto */}
      <section className="relative overflow-hidden bg-encabezado text-encabezado-texto">
        {tienda.bannerUrl && (
          <>
            <img src={tienda.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
          </>
        )}
        {!tienda.bannerUrl && <div className="absolute inset-0 bg-gradient-to-r from-encabezado to-encabezado-2" />}
        <div className={`relative mx-auto max-w-6xl px-4 ${tienda.bannerUrl ? "py-16 text-white sm:py-24" : "py-10"}`}>
          <h1 className="max-w-2xl text-2xl font-bold sm:text-4xl">{tienda.tituloPortada}</h1>
          <p className={`mt-2 max-w-xl ${tienda.bannerUrl ? "text-white/90" : "opacity-80"}`}>{tienda.textoPortada}</p>
        </div>
      </section>
      {!supabaseConfigurado && (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          Modo demostración: se muestran productos de ejemplo hasta conectar la base de datos.
        </p>
      )}
      {top.length > 0 && <Destacados productos={top} />}
      <Suspense>
        <Catalogo categorias={categorias} productos={productos} placeholder={tienda.textoBuscador} />
      </Suspense>
    </>
  );
}
