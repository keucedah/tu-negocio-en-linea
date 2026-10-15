/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import BotonAccion from "@/components/panel/BotonAccion";
import BotonCopiar from "@/components/panel/BotonCopiar";
import BotonRecibo from "@/components/panel/BotonRecibo";
import Formulario from "@/components/panel/Formulario";
import FormularioMototaxista from "@/components/panel/FormularioMototaxista";
import MensajeLibre from "@/components/panel/MensajeLibre";
import { eliminarMototaxista, eliminarPagoMototaxi, nuevoEnlaceMototaxista, registrarPagoMototaxi } from "@/app/admin/acciones-mototaxis";
import { obtenerAjustes } from "@/lib/panel/datos";
import {
  CLASE_ESTADO_MOTO, cuotaMototaxi, datosReciboMototaxi, estadoMototaxi, mensajeCobroMototaxi, numeroReciboMototaxi, obtenerMototaxista, obtenerPagosMototaxi,
  textoOcupado,
} from "@/lib/panel/mototaxis";
import { nombreMunicipio, obtenerUbicaciones } from "@/lib/panel/ubicaciones";
import { enlaceWhatsApp, fechaCorta, hoy, lempiras, sumarMeses } from "@/lib/negocio";
import { formatearCelular, numeroWhatsApp } from "@/lib/telefono";
import { urlSitio } from "@/lib/url";

export default async function FichaMototaxista({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const m = await obtenerMototaxista(Number(id));
  if (!m) notFound();
  const [ajustes, ubicaciones, pagos, sitio] = await Promise.all([obtenerAjustes(), obtenerUbicaciones(), obtenerPagosMototaxi(m.id), urlSitio()]);

  const e = estadoMototaxi(m, ajustes.dias_aviso);
  const cuota = cuotaMototaxi(m, ajustes);
  const municipio = nombreMunicipio(m.municipio_id, ubicaciones);
  const enlace = `${sitio}/mototaxi/${m.token}`;
  const numero = numeroWhatsApp(m.codigo_pais, m.celular);
  const h = hoy();
  const base = m.pagado_hasta && m.pagado_hasta >= h ? m.pagado_hasta : h;
  const saludo = `Hola ${m.nombre}, le saluda ${ajustes.nombre_negocio}. `;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/mototaxistas" className="text-sm text-gray-500 hover:underline">← Volver a mototaxistas</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {m.foto_url ? <img src={m.foto_url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl">🛺</span>}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{m.nombre}</h1>
              <p className="text-gray-600">
                {[m.codigo, m.numero_mototaxi && `Mototaxi N.º ${m.numero_mototaxi}`, formatearCelular(m.codigo_pais, m.celular), municipio].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CLASE_ESTADO_MOTO[e.estado]}`}>{e.texto}</span>
                {!m.acepto_publicar && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">Falta su permiso para publicar</span>}
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Elegido {m.veces_elegido} {m.veces_elegido === 1 ? "vez" : "veces"}</span>
              </div>
            </div>
          </div>
          <BotonAccion
            accion={eliminarMototaxista.bind(null, m.id)}
            confirmacion={`¿Eliminar a ${m.nombre} y todo su historial de pagos? Esto no se puede deshacer. Si solo dejó de trabajar, mejor desmarca “Activo”.`}
            className="boton-peligro"
          >
            Eliminar
          </BotonAccion>
        </div>
        {nuevo && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Mototaxista agregado con el código {m.codigo}. {m.pagado_hasta ? "" : "Registra su primer pago para que salga en las tiendas."}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section className="tarjeta">
            <h2 className="mb-3 text-lg font-bold">Mensualidad</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Cuota mensual</dt><dd className="text-xl font-black">{lempiras(cuota)}{m.cuota_personalizada != null && <span className="ml-1 text-xs font-normal text-gray-500">(especial)</span>}</dd></div>
              <div><dt className="text-gray-500">Pagado hasta</dt><dd className="font-semibold">{fechaCorta(m.pagado_hasta)}</dd></div>
              <div><dt className="text-gray-500">En las tiendas</dt><dd className="font-semibold">{!m.activo ? "No sale (dado de baja)" : !m.acepto_publicar ? "No sale (falta permiso)" : e.suspendido ? "No sale (suspendido)" : textoOcupado(m) ? `Sale en gris: ${textoOcupado(m).toLowerCase()}` : "Sale y se puede elegir"}</dd></div>
              <div><dt className="text-gray-500">Total pagado</dt><dd className="font-semibold">{lempiras(pagos.reduce((s, p) => s + p.monto, 0))}</dd></div>
            </dl>
          </section>

          <section className="tarjeta space-y-3">
            <h2 className="text-lg font-bold">Su página personal</h2>
            <p className="text-sm text-gray-600">
              Ahí ve si está al día, hasta cuándo pagó y tiene un botón para escribirte. No necesita contraseña: compártele el enlace solo a él.
            </p>
            <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs">{enlace}</p>
            <div className="flex flex-wrap gap-2">
              <BotonCopiar texto={enlace} etiqueta="Copiar enlace" />
              <a href={enlace} target="_blank" rel="noopener noreferrer" className="boton-secundario">Abrir</a>
              {numero && (
                <a href={enlaceWhatsApp(m.codigo_pais, m.celular, `${saludo}Esta es su página de mototaxista, ahí puede ver si está al día: ${enlace}`)} target="_blank" rel="noopener noreferrer" className="boton-whatsapp">
                  Enviarle el enlace
                </a>
              )}
              <BotonAccion accion={nuevoEnlaceMototaxista.bind(null, m.id)} confirmacion="¿Crear un enlace nuevo? El anterior dejará de funcionar." className="text-sm font-medium text-gray-600 hover:underline">
                Crear enlace nuevo
              </BotonAccion>
            </div>
          </section>

          {numero && (
            <section className="tarjeta space-y-3">
              <h2 className="text-lg font-bold">Mensajes por WhatsApp</h2>
              <a href={enlaceWhatsApp(m.codigo_pais, m.celular, mensajeCobroMototaxi(m, ajustes, enlace))} target="_blank" rel="noopener noreferrer" className="boton-whatsapp w-full">
                Cobrar ahora ({e.suspendido ? "está suspendido" : "recordatorio"})
              </a>
              <details className="rounded-lg border p-3">
                <summary className="cursor-pointer text-sm font-semibold">Ver el mensaje de cobro</summary>
                <p className="mt-2 whitespace-pre-line rounded bg-gray-50 p-2 text-sm text-gray-700">{mensajeCobroMototaxi(m, ajustes, enlace)}</p>
              </details>
              <div>
                <p className="mb-1 text-sm font-semibold">Mensaje libre</p>
                <MensajeLibre numero={numero} saludo={saludo} />
              </div>
            </section>
          )}

          <section id="pago" className="tarjeta scroll-mt-4">
            <h2 className="mb-3 text-lg font-bold">Registrar pago</h2>
            <Formulario accion={registrarPagoMototaxi} boton="Registrar pago" limpiar>
              <input type="hidden" name="mototaxista_id" value={m.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="etiqueta">Meses que paga</span>
                  <input name="meses" type="number" min={1} max={24} defaultValue={1} className="campo" />
                </label>
                <label className="block">
                  <span className="etiqueta">Monto (L)</span>
                  <input name="monto" inputMode="decimal" defaultValue={cuota || ""} required className="campo" />
                </label>
                <label className="block">
                  <span className="etiqueta">Fecha</span>
                  <input name="fecha" type="date" defaultValue={h} className="campo" />
                </label>
                <label className="block">
                  <span className="etiqueta">Forma de pago</span>
                  <input name="metodo" list="metodos-moto" maxLength={40} className="campo" placeholder="Efectivo, transferencia…" />
                  <datalist id="metodos-moto">
                    <option value="Efectivo" /><option value="Transferencia" /><option value="Tigo Money" /><option value="Depósito" />
                  </datalist>
                </label>
                <label className="block sm:col-span-2">
                  <span className="etiqueta">Nota</span>
                  <input name="nota" maxLength={300} className="campo" />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Con 1 mes queda pagado hasta el {fechaCorta(sumarMeses(base, 1))}.{" "}
                {e.suspendido && "Como estaba vencido, se cuenta desde el día que paga."}
              </p>
            </Formulario>
          </section>

          <section className="tarjeta">
            <h2 className="mb-3 text-lg font-bold">Historial de pagos</h2>
            {pagos.length === 0 ? (
              <p className="text-sm text-gray-600">Sin pagos registrados.</p>
            ) : (
              <ul className="divide-y text-sm">
                {pagos.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <div>
                      <p className="font-semibold">{lempiras(p.monto)} · {p.meses === 1 ? "1 mes" : `${p.meses} meses`}</p>
                      <p className="text-xs text-gray-500">
                        {[`Recibo N.º ${numeroReciboMototaxi(m, p)}`, fechaCorta(p.fecha), `hasta ${fechaCorta(p.pagado_hasta)}`, p.metodo, p.nota].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <BotonRecibo datos={datosReciboMototaxi(p, m, ajustes, municipio)} />
                      <BotonAccion accion={eliminarPagoMototaxi.bind(null, p.id)} confirmacion={`¿Eliminar este pago de ${lempiras(p.monto)}?`}>
                        Eliminar
                      </BotonAccion>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="tarjeta lg:self-start">
          <h2 className="mb-3 text-lg font-bold">Datos del mototaxista</h2>
          <FormularioMototaxista mototaxista={m} ubicaciones={ubicaciones} cuotaNormal={ajustes.cuota_mototaxi} hoy={h} />
        </section>
      </div>
    </div>
  );
}
