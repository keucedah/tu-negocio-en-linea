import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FormularioProducto from "@/components/tienda/admin/FormularioProducto";
import { actualizarProducto } from "@/app/acciones-tienda";
import { obtenerAdminTienda } from "@/lib/supabase/server";
import { obtenerBase, obtenerCategorias, obtenerFilaTienda, obtenerProducto } from "@/lib/tienda/datos";
import { supabaseConfigurado } from "@/lib/config";

// Página privada: no debe salir en Google
export const metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function EditarProducto({ params }: { params: Promise<{ tienda: string; id: string }> }) {
  const { tienda: slug, id } = await params;
  const base = await obtenerBase();
  if (!supabaseConfigurado) redirect(`${base}/admin`);
  const tienda = await obtenerFilaTienda(slug);
  if (!tienda) notFound();
  const { esAdmin } = await obtenerAdminTienda(tienda.id);
  if (!esAdmin) redirect(`${base}/admin`);

  const [{ producto }, categorias] = await Promise.all([
    obtenerProducto(tienda.id, Number(id)),
    obtenerCategorias(tienda.id),
  ]);
  if (!producto) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link href={`${base}/admin`} className="text-sm text-gray-500 hover:text-marca-600">← Volver al panel</Link>
      <section className="mt-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="mb-4 text-xl font-bold">Editar producto</h1>
        <FormularioProducto categorias={categorias} accion={actualizarProducto.bind(null, tienda.id)} producto={producto} />
      </section>
    </div>
  );
}
