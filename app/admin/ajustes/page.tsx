import Formulario from "@/components/panel/Formulario";
import { guardarAjustes } from "@/app/admin/acciones";
import { obtenerAjustes } from "@/lib/panel/datos";
import { PAISES } from "@/lib/telefono";

export default async function Ajustes() {
  const a = await obtenerAjustes();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Ajustes de la plataforma</h1>
      <div className="tarjeta">
        <Formulario accion={guardarAjustes} boton="Guardar ajustes" className="space-y-4">
          <h2 className="text-lg font-bold">Datos que ve el público</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="etiqueta">Nombre de la plataforma</span>
              <input name="nombre_negocio" required maxLength={60} defaultValue={a.nombre_negocio} className="campo" />
            </label>
            <label className="block">
              <span className="etiqueta">Eslogan (va debajo del nombre)</span>
              <input name="eslogan" maxLength={80} defaultValue={a.eslogan} className="campo" placeholder="Plataforma SaaS de catálogos en línea" />
            </label>
            <div>
              <span className="etiqueta">Celular / WhatsApp</span>
              <div className="flex gap-2">
                <select name="codigo_pais" defaultValue={a.codigo_pais} className="campo w-32 shrink-0">
                  {PAISES.map((p) => (
                    <option key={p.codigo} value={p.codigo}>{p.nombre} (+{p.codigo})</option>
                  ))}
                </select>
                <input name="celular" inputMode="tel" defaultValue={a.celular} className="campo" />
              </div>
            </div>
            <label className="block">
              <span className="etiqueta">Correo de contacto</span>
              <input name="correo" type="email" maxLength={120} defaultValue={a.correo} className="campo" />
            </label>
            <label className="block">
              <span className="etiqueta">Dirección</span>
              <input name="direccion" maxLength={200} defaultValue={a.direccion} className="campo" />
            </label>
            <label className="block">
              <span className="etiqueta">Precio de instalación (L, pago único)</span>
              <input name="precio_instalacion" inputMode="decimal" defaultValue={a.precio_instalacion} className="campo" />
            </label>
            <label className="block">
              <span className="etiqueta">Precio del dominio (L al mes)</span>
              <input name="precio_dominio" inputMode="decimal" defaultValue={a.precio_dominio} className="campo" />
            </label>
          </div>

          <h2 className="border-t pt-4 text-lg font-bold">Cobros</h2>
          <label className="block sm:w-1/2">
            <span className="etiqueta">Avisar “por vencer” cuántos días antes</span>
            <input name="dias_aviso" type="number" min={0} max={60} defaultValue={a.dias_aviso} className="campo" />
          </label>
          <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            En los mensajes puedes usar: <b>{"{contacto}"}</b> nombre del cliente, <b>{"{negocio}"}</b> su negocio, <b>{"{plan}"}</b>, <b>{"{monto}"}</b> su cuota,{" "}
            <b>{"{fecha}"}</b> próximo pago, <b>{"{limite}"}</b> productos, <b>{"{mi_negocio}"}</b>, <b>{"{mi_celular}"}</b> y, en el recibo, <b>{"{fecha_pago}"}</b>.
            Las palabras entre *asteriscos* salen en negrita en WhatsApp.
          </p>
          <label className="block">
            <span className="etiqueta">Mensaje de recordatorio de pago</span>
            <textarea name="plantilla_cobro" rows={5} maxLength={1500} defaultValue={a.plantilla_cobro} className="campo" />
          </label>
          <label className="block">
            <span className="etiqueta">Mensaje de pago vencido</span>
            <textarea name="plantilla_vencido" rows={5} maxLength={1500} defaultValue={a.plantilla_vencido} className="campo" />
          </label>
          <label className="block">
            <span className="etiqueta">Mensaje de recibo (pago recibido)</span>
            <textarea name="plantilla_recibo" rows={4} maxLength={1500} defaultValue={a.plantilla_recibo} className="campo" />
          </label>
        </Formulario>
      </div>
    </div>
  );
}
