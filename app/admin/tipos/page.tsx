import BotonAccion from "@/components/panel/BotonAccion";
import Formulario from "@/components/panel/Formulario";
import { eliminarTipo, guardarTipo } from "@/app/admin/acciones";
import { obtenerClientes, obtenerTipos } from "@/lib/panel/datos";
import type { TipoNegocio } from "@/lib/panel/types";

function CamposTipo({ tipo }: { tipo?: TipoNegocio }) {
  return (
    <>
      {tipo && <input type="hidden" name="id" value={tipo.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Nombre *</span>
          <input name="nombre" required maxLength={60} defaultValue={tipo?.nombre} className="campo" placeholder="Panadería" />
        </label>
        <label className="block">
          <span className="etiqueta">Orden en la lista</span>
          <input name="orden" type="number" defaultValue={tipo?.orden ?? 50} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Color principal (botones)</span>
          <input name="color_principal" type="color" defaultValue={tipo?.color_principal ?? "#ea580c"} className="h-10 w-full cursor-pointer rounded-lg border" />
        </label>
        <label className="block">
          <span className="etiqueta">Color del encabezado</span>
          <input name="color_encabezado" type="color" defaultValue={tipo?.color_encabezado ?? "#111827"} className="h-10 w-full cursor-pointer rounded-lg border" />
        </label>
      </div>
      <label className="block">
        <span className="etiqueta">Título de la portada</span>
        <input name="titulo_portada" maxLength={80} defaultValue={tipo?.titulo_portada} className="campo" placeholder="Pan fresco todos los días" />
      </label>
      <label className="block">
        <span className="etiqueta">Texto de la portada</span>
        <textarea name="texto_portada" rows={2} maxLength={200} defaultValue={tipo?.texto_portada} className="campo" />
      </label>
      <label className="block">
        <span className="etiqueta">Texto del buscador</span>
        <input name="texto_buscador" maxLength={60} defaultValue={tipo?.texto_buscador} className="campo" placeholder="Busca pan, pasteles…" />
      </label>
      <label className="block">
        <span className="etiqueta">Categorías iniciales (una por línea)</span>
        <textarea name="categorias" rows={4} maxLength={1000} defaultValue={tipo?.categorias} className="campo" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activo" defaultChecked={tipo?.activo ?? true} className="h-4 w-4" />
        Mostrar al agregar clientes
      </label>
    </>
  );
}

export default async function Tipos() {
  const [tipos, clientes] = await Promise.all([obtenerTipos(), obtenerClientes()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de negocio</h1>
        <p className="text-sm text-gray-600">
          Al crear la tienda de un cliente, empieza con los colores y las categorías de su tipo. Si el cliente deja vacíos los textos de su portada,
          se usan los de aquí. Cambiar un tipo no cambia los colores de las tiendas que ya existen.
        </p>
      </div>
      <div className="space-y-3">
        {tipos.map((t) => {
          const usan = clientes.filter((c) => c.tipo_negocio_id === t.id).length;
          return (
            <details key={t.id} className="tarjeta p-0">
              <summary className="flex cursor-pointer items-center gap-3 p-4">
                <span className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                  <span className="h-6 w-3" style={{ background: t.color_encabezado }} />
                  <span className="h-6 w-3" style={{ background: t.color_principal }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-bold">{t.nombre}</span>
                  {!t.activo && <span className="ml-2 text-xs text-gray-500">(oculto)</span>}
                  <span className="block truncate text-xs text-gray-500">
                    {usan} cliente(s) · {t.categorias ? t.categorias.split("\n").length : 0} categorías
                  </span>
                </span>
                <span className="text-sm font-medium text-marca-700">Editar</span>
              </summary>
              <div className="space-y-3 border-t p-4">
                <Formulario accion={guardarTipo} boton="Guardar">
                  <CamposTipo tipo={t} />
                </Formulario>
                <div className="text-right">
                  <BotonAccion accion={eliminarTipo.bind(null, t.id)} confirmacion={`¿Eliminar el tipo “${t.nombre}”?`}>
                    Eliminar este tipo
                  </BotonAccion>
                </div>
              </div>
            </details>
          );
        })}
      </div>
      <section className="tarjeta border-2 border-dashed">
        <h2 className="mb-3 text-lg font-bold">Agregar tipo de negocio</h2>
        <Formulario accion={guardarTipo} boton="Crear tipo" limpiar>
          <CamposTipo />
        </Formulario>
      </section>
    </div>
  );
}
