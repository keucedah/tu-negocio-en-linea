import Link from "next/link";
import { notFound } from "next/navigation";
import ImagenProducto from "@/components/tienda/ImagenProducto";
import FormularioProducto from "@/components/tienda/admin/FormularioProducto";
import FormularioCategoria from "@/components/tienda/admin/FormularioCategoria";
import FormularioTienda from "@/components/tienda/admin/FormularioTienda";
import FormularioApariencia from "@/components/tienda/admin/FormularioApariencia";
import BotonEliminar from "@/components/tienda/admin/BotonEliminar";
import BotonDestacado from "@/components/tienda/admin/BotonDestacado";
import {
  cambiarDestacado,
  crearCategoria,
  crearProducto,
  eliminarCategoria,
  eliminarProducto,
  guardarApariencia,
  guardarConfiguracion,
  moverDestacado,
} from "@/app/acciones-tienda";
import { cerrarSesion } from "@/app/acciones-entrar-tienda";
import { obtenerAdminTienda } from "@/lib/supabase/server";
import { aTienda, destacados, obtenerBase, obtenerCatalogo, obtenerFilaTienda } from "@/lib/tienda/datos";
import { supabaseConfigurado } from "@/lib/config";

export const dynamic = "force-dynamic";

const SECCIONES = [
  { id: "productos", nombre: "Productos" },
  { id: "destacados", nombre: "Lo más vendido" },
  { id: "apariencia", nombre: "Apariencia" },
  { id: "tienda", nombre: "Datos y categorías" },
] as const;
type Seccion = (typeof SECCIONES)[number]["id"];

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold">{titulo}</h1>
      <div className="mt-2 text-gray-600">{children}</div>
    </div>
  );
}

const tarjeta = "rounded-2xl border bg-white p-5 shadow-sm";

export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ tienda: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  if (!supabaseConfigurado) {
    return (
      <Aviso titulo="Panel no disponible en modo demostración">
        Conecta Supabase siguiendo el manual para poder iniciar sesión y subir productos.
      </Aviso>
    );
  }

  const fila = await obtenerFilaTienda((await params).tienda);
  if (!fila) notFound();
  const { user, esAdmin } = await obtenerAdminTienda(fila.id);
  if (!user || !esAdmin) {
    return (
      <Aviso titulo="Sin permisos de administrador">
        <p>Tu cuenta no tiene permiso para administrar esta tienda.</p>
        <form action={cerrarSesion} className="mt-4">
          <button className="boton-secundario">Cerrar sesión</button>
        </form>
      </Aviso>
    );
  }

  const pedido = (await searchParams).s;
  const seccion: Seccion = SECCIONES.some((x) => x.id === pedido) ? (pedido as Seccion) : "productos";
  const [{ categorias, productos }, base] = await Promise.all([obtenerCatalogo(fila.id), obtenerBase()]);
  const tienda = aTienda(fila);
  const top = destacados(productos);
  const nombreCat = new Map(categorias.map((c) => [c.id, c.nombre]));
  const conteo = new Map<number, number>();
  for (const p of productos) if (p.categoria_id) conteo.set(p.categoria_id, (conteo.get(p.categoria_id) ?? 0) + 1);
  const tipo = fila.tipo_negocio_otro || fila.tipo?.nombre;

  const destacar = cambiarDestacado.bind(null, fila.id);
  const mover = moverDestacado.bind(null, fila.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Panel de tu tienda</h1>
          <p className="text-sm text-gray-500">
            {user.email}
            {tipo ? ` · ${tipo}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={base || "/"} className="boton-secundario">Ver catálogo</Link>
          <form action={cerrarSesion}>
            <button className="boton-secundario">Cerrar sesión</button>
          </form>
        </div>
      </div>

      {!fila.activa && (
        <p className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">
          Tu tienda está suspendida: los visitantes no ven el catálogo. Comunícate con tu proveedor para reactivarla.
        </p>
      )}

      <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b px-4" aria-label="Secciones del panel">
        {SECCIONES.map((x) => (
          <Link
            key={x.id}
            href={`${base}/admin${x.id === "productos" ? "" : `?s=${x.id}`}`}
            aria-current={seccion === x.id ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${
              seccion === x.id ? "border-marca-600 text-marca-700" : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {x.nombre}
            {x.id === "destacados" && top.length > 0 && <span className="ml-1 text-xs text-gray-400">({top.length})</span>}
          </Link>
        ))}
      </nav>

      {seccion === "productos" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <section className={`${tarjeta} lg:self-start`}>
            <h2 className="mb-4 text-lg font-bold">Agregar producto</h2>
            {categorias.length === 0 ? (
              <p className="text-sm text-gray-600">
                Primero crea al menos una categoría en{" "}
                <Link href={`${base}/admin?s=tienda`} className="font-semibold text-marca-700 hover:underline">Datos y categorías</Link>.
              </p>
            ) : (
              <FormularioProducto categorias={categorias} accion={crearProducto.bind(null, fila.id)} />
            )}
          </section>

          <section className={tarjeta}>
            <h2 className="mb-1 text-lg font-bold">Productos ({productos.length})</h2>
            <p className="mb-3 text-xs text-gray-500">Toca la estrella para poner un producto en “Lo más vendido”.</p>
            {productos.length === 0 ? (
              <p className="text-sm text-gray-600">Aún no hay productos. Agrega el primero con el formulario.</p>
            ) : (
              <ul className="divide-y">
                {productos.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 py-3 sm:gap-3">
                    <ImagenProducto src={p.imagen_url} alt={p.nombre} className="h-14 w-14 shrink-0 rounded-lg sm:h-16 sm:w-16" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.categoria_id ? nombreCat.get(p.categoria_id) : "Sin categoría"}</p>
                      <div className="mt-1 flex gap-4 sm:hidden">
                        <Link href={`${base}/admin/producto/${p.id}`} className="text-sm font-medium text-marca-600 hover:underline">Editar</Link>
                        <BotonEliminar id={p.id} accion={eliminarProducto.bind(null, fila.id)} confirmacion={`¿Eliminar “${p.nombre}”?`} />
                      </div>
                    </div>
                    <BotonDestacado id={p.id} nombre={p.nombre} destacado={Boolean(p.destacado)} accion={destacar} />
                    <div className="hidden items-center gap-3 sm:flex">
                      <Link href={`${base}/admin/producto/${p.id}`} className="text-sm font-medium text-marca-600 hover:underline">Editar</Link>
                      <BotonEliminar id={p.id} accion={eliminarProducto.bind(null, fila.id)} confirmacion={`¿Eliminar “${p.nombre}”?`} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {seccion === "destacados" && (
        <section className={`${tarjeta} max-w-3xl`}>
          <h2 className="text-lg font-bold">Lo más vendido</h2>
          <p className="mb-4 mt-1 text-sm text-gray-600">
            Estos productos salen en el carrusel de arriba de tu catálogo, en este orden. Puedes tener hasta 12. Para agregar más, toca la estrella
            de un producto en la pestaña <Link href={`${base}/admin`} className="font-semibold text-marca-700 hover:underline">Productos</Link>.
          </p>
          {top.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-3 py-6 text-center text-sm text-gray-600">
              Todavía no marcaste ninguno. Mientras no haya, el carrusel no se muestra.
            </p>
          ) : (
            <ol className="divide-y">
              {top.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 py-3 sm:gap-3">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-gray-400">{i + 1}</span>
                  <ImagenProducto src={p.imagen_url} alt={p.nombre} className="h-10 w-10 shrink-0 rounded-lg sm:h-14 sm:w-14" />
                  <p className="min-w-0 flex-1 truncate font-medium">{p.nombre}</p>
                  <form action={mover}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="arriba" />
                    <button disabled={i === 0} className="boton-secundario h-9 w-9 p-0" aria-label={`Subir ${p.nombre}`}>↑</button>
                  </form>
                  <form action={mover}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="dir" value="abajo" />
                    <button disabled={i === top.length - 1} className="boton-secundario h-9 w-9 p-0" aria-label={`Bajar ${p.nombre}`}>↓</button>
                  </form>
                  <BotonDestacado id={p.id} nombre={p.nombre} destacado accion={destacar} conTexto />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {seccion === "apariencia" && (
        <section className={tarjeta}>
          <h2 className="mb-1 text-lg font-bold">Apariencia de tu tienda</h2>
          <p className="mb-5 text-sm text-gray-600">Elige tus colores, el banner y los textos de la portada. El logo se cambia en “Datos y categorías”.</p>
          <FormularioApariencia
            tienda={fila}
            sugeridos={{ titulo: tienda.tituloPortada, texto: tienda.textoPortada, buscador: tienda.textoBuscador }}
            accion={guardarApariencia.bind(null, fila.id)}
          />
        </section>
      )}

      {seccion === "tienda" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className={`${tarjeta} lg:self-start`}>
            <h2 className="mb-4 text-lg font-bold">Datos de la tienda</h2>
            <FormularioTienda config={fila} accion={guardarConfiguracion.bind(null, fila.id)} />
          </section>
          <section className={`${tarjeta} lg:self-start`}>
            <h2 className="mb-3 text-lg font-bold">Categorías</h2>
            <FormularioCategoria accion={crearCategoria.bind(null, fila.id)} />
            <ul className="mt-4 divide-y text-sm">
              {categorias.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span>
                    {c.nombre} <span className="text-gray-400">({conteo.get(c.id) ?? 0})</span>
                  </span>
                  <BotonEliminar
                    id={c.id}
                    accion={eliminarCategoria.bind(null, fila.id)}
                    confirmacion={`¿Eliminar la categoría “${c.nombre}”? Sus productos quedarán sin categoría.`}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
