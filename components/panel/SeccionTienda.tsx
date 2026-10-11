import { cookies } from "next/headers";
import BotonCopiar from "./BotonCopiar";
import CamposTienda from "./CamposTienda";
import Formulario from "./Formulario";
import { cambiarClaveTienda, crearTiendaCliente } from "@/app/admin/acciones";
import { servicioConfigurado, supabaseConfigurado } from "@/lib/config";
import { urlSitio } from "@/lib/url";
import { claveAleatoria } from "@/lib/clave";
import { obtenerTiendaCliente } from "@/lib/panel/tiendas";
import { numeroWhatsApp } from "@/lib/telefono";
import type { Ajustes, Cliente } from "@/lib/panel/types";

async function accesoReciente(clienteId: number): Promise<{ correo: string; clave: string } | null> {
  try {
    const v = JSON.parse((await cookies()).get("acceso_nuevo")?.value ?? "null");
    return v?.clienteId === clienteId ? { correo: String(v.correo ?? ""), clave: String(v.clave ?? "") } : null;
  } catch {
    return null;
  }
}

/** Tienda en línea del cliente: crearla, ver su enlace y dominio, uso del plan y acceso del dueño. */
export default async function SeccionTienda({ cliente, ajustes }: { cliente: Cliente; ajustes: Ajustes }) {
  if (supabaseConfigurado && !servicioConfigurado) {
    return (
      <section className="tarjeta">
        <h2 className="text-lg font-bold">Tienda en línea</h2>
        <p className="mt-1 text-sm text-gray-600">
          Para crear y manejar la tienda del cliente desde aquí, agrega la variable <b>SUPABASE_SERVICE_ROLE_KEY</b> en Vercel (ver README).
        </p>
      </section>
    );
  }

  const tienda = await obtenerTiendaCliente(cliente.tienda_id);
  if (!tienda) {
    return (
      <section className="tarjeta">
        <h2 className="text-lg font-bold">Tienda en línea</h2>
        <p className="mb-3 mt-1 text-sm text-gray-600">
          Este cliente todavía no tiene tienda. Al crearla se le hace su usuario y queda con el límite de productos de su plan.
        </p>
        <Formulario accion={crearTiendaCliente} boton="Crear su tienda">
          <input type="hidden" name="id" value={cliente.id} />
          <CamposTienda negocio={cliente.negocio} correo={cliente.correo} claveSugerida={claveAleatoria()} urlTiendas={await urlSitio()} />
        </Formulario>
      </section>
    );
  }

  const acceso = await accesoReciente(cliente.id);
  const correo = acceso?.correo || tienda.duenos[0] || "";
  const urlDominio = tienda.dominio ? `https://${tienda.dominio}` : "";
  const principal = urlDominio || tienda.enlace;
  const mensajeAcceso = [
    `Hola ${cliente.contacto || cliente.negocio}, le saluda ${ajustes.nombre_negocio}.`,
    `Su tienda en línea ya está lista: ${principal}`,
    "",
    `Para agregar sus productos entre a ${principal}/entrar`,
    `Correo: ${correo}`,
    acceso?.clave ? `Contraseña: ${acceso.clave}` : "Contraseña: la que le enviamos.",
  ].join("\n");
  const numero = numeroWhatsApp(cliente.codigo_pais, cliente.celular);
  const uso = Math.min(100, Math.round((tienda.productos / tienda.limite_productos) * 100));

  return (
    <section className="tarjeta space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Tienda en línea</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tienda.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {tienda.activa ? "Activa" : "Suspendida"}
        </span>
      </div>
      {!tienda.activa && (
        <p className="text-sm text-gray-600">Los visitantes ven “Tienda no disponible”. Se activa sola al poner el cliente en “Activo” o “En prueba”, o al registrar una mensualidad.</p>
      )}

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-gray-500">Enlace</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <a href={tienda.enlace} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-marca-700 hover:underline">{tienda.enlace}</a>
            <BotonCopiar texto={tienda.enlace} etiqueta="Copiar" />
          </dd>
          <dd className="mt-1">
            <a href={`${tienda.enlace}/admin`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-gray-600 hover:underline">
              Abrir el panel de su tienda (para ayudarle con productos, colores o banner) ↗
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Dominio propio</dt>
          <dd>
            {urlDominio ? (
              <>
                <a href={urlDominio} target="_blank" rel="noopener noreferrer" className="font-semibold text-marca-700 hover:underline">{tienda.dominio}</a>
                <span className="mt-1 block text-xs text-gray-500">Agrégalo también en Vercel &gt; Settings &gt; Domains de la plataforma.</span>
              </>
            ) : (
              <span className="text-gray-600">No tiene. Escribe el dominio y marca “Incluye dominio web” en sus datos.</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Productos</dt>
          <dd>
            <span className="font-semibold">{tienda.productos.toLocaleString("es-HN")}</span> de {tienda.limite_productos.toLocaleString("es-HN")}
            {tienda.nombre_plan ? ` (plan ${tienda.nombre_plan})` : ""}
            <span className="mt-1 block h-2 overflow-hidden rounded-full bg-gray-100">
              <span className={`block h-full ${uso >= 90 ? "bg-red-500" : "bg-marca-500"}`} style={{ width: `${uso}%` }} />
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Entra a su tienda con</dt>
          <dd className="font-semibold">{tienda.duenos.join(", ") || "Sin usuario"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Para su app Android</dt>
          <dd><code className="rounded bg-gray-100 px-1.5 py-0.5">tienda={tienda.slug}</code></dd>
        </div>
      </dl>

      {acceso?.clave && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          <p className="font-semibold">Acceso para enviarle (se muestra solo unos minutos):</p>
          <p className="mt-1">Correo: <b>{acceso.correo}</b></p>
          <p>Contraseña: <b className="font-mono">{acceso.clave}</b></p>
        </div>
      )}

      {numero && (
        <a href={`https://wa.me/${numero}?text=${encodeURIComponent(mensajeAcceso)}`} target="_blank" rel="noopener noreferrer" className="boton-whatsapp w-full">
          Enviar acceso por WhatsApp
        </a>
      )}

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Cambiar la contraseña de su tienda</summary>
        <Formulario accion={cambiarClaveTienda} boton="Cambiar contraseña" className="mt-3 space-y-3">
          <input type="hidden" name="id" value={cliente.id} />
          <input type="hidden" name="correo" value={tienda.duenos[0] ?? ""} />
          <input name="clave" defaultValue={claveAleatoria()} minLength={8} maxLength={72} className="campo font-mono" autoComplete="off" />
        </Formulario>
      </details>
    </section>
  );
}
