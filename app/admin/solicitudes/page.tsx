import Link from "next/link";
import BotonAccion from "@/components/panel/BotonAccion";
import { eliminarSolicitud, marcarSolicitud } from "@/app/admin/acciones";
import { obtenerAjustes, obtenerSolicitudes } from "@/lib/panel/datos";
import { fechaCorta } from "@/lib/negocio";

export default async function Solicitudes() {
  const [solicitudes, ajustes] = await Promise.all([obtenerSolicitudes(), obtenerAjustes()]);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de demostración</h1>
        <p className="text-sm text-gray-600">Personas que llenaron el formulario de la página pública.</p>
      </div>
      {solicitudes.length === 0 && <p className="tarjeta text-gray-600">No hay solicitudes todavía.</p>}
      <ul className="space-y-3">
        {solicitudes.map((s) => {
          const digitos = s.celular.replace(/\D/g, "");
          const numero = digitos.length === 8 ? ajustes.codigo_pais + digitos : digitos;
          const texto = `Hola ${s.nombre}, le saluda ${ajustes.nombre_negocio}. Recibimos su solicitud de demostración de la tienda en línea.`;
          const nuevo = new URLSearchParams({ negocio: s.negocio || s.nombre, contacto: s.nombre, celular: digitos });
          return (
            <li key={s.id} className={`tarjeta ${s.atendida ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{s.nombre}{s.negocio && <span className="font-normal text-gray-600"> · {s.negocio}</span>}</p>
                  <p className="text-sm text-gray-600">{s.celular} · {fechaCorta(s.creado_en)}</p>
                  {s.mensaje && <p className="mt-2 whitespace-pre-line text-sm">{s.mensaje}</p>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.atendida ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-800"}`}>
                  {s.atendida ? "Atendida" : "Pendiente"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                {numero && (
                  <a href={`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer" className="boton-whatsapp py-1.5">
                    Responder por WhatsApp
                  </a>
                )}
                <Link href={`/admin/clientes/nuevo?${nuevo}`} className="boton-secundario py-1.5">Convertir en cliente</Link>
                <BotonAccion accion={marcarSolicitud.bind(null, s.id, !s.atendida)} className="boton-secundario py-1.5">
                  {s.atendida ? "Marcar pendiente" : "Marcar atendida"}
                </BotonAccion>
                <BotonAccion accion={eliminarSolicitud.bind(null, s.id)} confirmacion="¿Eliminar esta solicitud?">Eliminar</BotonAccion>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
