import BotonAccion from "@/components/panel/BotonAccion";
import Formulario from "@/components/panel/Formulario";
import { eliminarPlan, guardarPlan } from "@/app/admin/acciones";
import { obtenerClientes, obtenerPlanes } from "@/lib/panel/datos";
import { COLOR_PLAN, NOMBRE_COLOR } from "@/lib/panel/colores";
import { lempiras } from "@/lib/negocio";
import type { ColorPlan, Plan } from "@/lib/panel/types";

function CamposPlan({ plan }: { plan?: Plan }) {
  return (
    <>
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Nombre *</span>
          <input name="nombre" required maxLength={40} defaultValue={plan?.nombre} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Subtítulo</span>
          <input name="subtitulo" maxLength={80} defaultValue={plan?.subtitulo} className="campo" placeholder="Para negocios pequeños" />
        </label>
        <label className="block">
          <span className="etiqueta">Precio mensual (L) *</span>
          <input name="precio_mensual" inputMode="decimal" required defaultValue={plan?.precio_mensual} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Límite de productos *</span>
          <input name="limite_productos" inputMode="numeric" required defaultValue={plan?.limite_productos} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Color</span>
          <select name="color" defaultValue={plan?.color ?? "azul"} className="campo">
            {(Object.keys(NOMBRE_COLOR) as ColorPlan[]).map((c) => (
              <option key={c} value={c}>{NOMBRE_COLOR[c]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiqueta">Orden en la página</span>
          <input name="orden" type="number" defaultValue={plan?.orden ?? 0} className="campo" />
        </label>
      </div>
      <label className="block">
        <span className="etiqueta">Lo que incluye (una línea por cada punto)</span>
        <textarea name="caracteristicas" rows={3} maxLength={1000} defaultValue={plan?.caracteristicas} className="campo" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="visible" defaultChecked={plan?.visible ?? true} className="h-4 w-4" />
        Mostrar en la página pública
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="con_publicidad" defaultChecked={plan?.con_publicidad ?? false} className="mt-0.5 h-4 w-4" />
        <span>
          Muestra publicidad de otras tiendas
          <span className="block text-xs text-gray-500">Si lo desmarcas, en la página pública este plan dice “Sin publicidad de otras tiendas”. Tus anuncios (sorteos y premios) salen en todos los planes.</span>
        </span>
      </label>
    </>
  );
}

export default async function Planes() {
  const [planes, clientes] = await Promise.all([obtenerPlanes(), obtenerClientes()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planes</h1>
        <p className="text-sm text-gray-600">Lo que cambies aquí se ve en la página pública. El límite de productos se usa al cobrar y al aplicar el límite en la tienda de cada cliente.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {planes.map((p) => {
          const usan = clientes.filter((c) => c.plan_id === p.id).length;
          return (
            <section key={p.id} className={`tarjeta border-t-8 ${COLOR_PLAN[p.color].borde}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{p.nombre} {!p.visible && <span className="text-xs font-normal text-gray-500">(oculto)</span>}</h2>
                  <p className="text-sm text-gray-500">{lempiras(p.precio_mensual)}/mes · {p.limite_productos.toLocaleString("es-HN")} productos · {usan} cliente(s) · {p.con_publicidad ? "con publicidad" : "sin publicidad"}</p>
                </div>
                <BotonAccion accion={eliminarPlan.bind(null, p.id)} confirmacion={`¿Eliminar el plan “${p.nombre}”?`}>Eliminar</BotonAccion>
              </div>
              <Formulario accion={guardarPlan} boton="Guardar plan">
                <CamposPlan plan={p} />
              </Formulario>
            </section>
          );
        })}
        <section className="tarjeta border-2 border-dashed">
          <h2 className="mb-3 text-lg font-bold">Crear plan nuevo</h2>
          <Formulario accion={guardarPlan} boton="Crear plan" limpiar>
            <CamposPlan />
          </Formulario>
        </section>
      </div>
    </div>
  );
}
