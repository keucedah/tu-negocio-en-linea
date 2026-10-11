import Link from "next/link";
import { notFound } from "next/navigation";
import BotonAccion from "@/components/panel/BotonAccion";
import Formulario from "@/components/panel/Formulario";
import FormularioCliente from "@/components/panel/FormularioCliente";
import MensajeLibre from "@/components/panel/MensajeLibre";
import SeccionTienda from "@/components/panel/SeccionTienda";
import { InsigniaCobro, InsigniaEstado } from "@/components/panel/Insignias";
import { cambiarPlan, eliminarCliente, eliminarPago, registrarPago } from "@/app/admin/acciones";
import { nombreTipo, obtenerAjustes, obtenerCliente, obtenerPagos, obtenerPlanes, obtenerTipos } from "@/lib/panel/datos";
import { mensajeCobro } from "@/lib/panel/filas";
import {
  NOMBRE_CONCEPTO, cuotaMensual, datosMensaje, enlaceWhatsApp, estadoCobro, fechaCorta, hoy, lempiras, limiteProductos, llenarPlantilla, sumarMeses, textoCobro,
} from "@/lib/negocio";
import { formatearCelular, numeroWhatsApp } from "@/lib/telefono";

export default async function FichaCliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string; error_tienda?: string }> }) {
  const { id } = await params;
  const { nuevo, error_tienda } = await searchParams;
  const cliente = await obtenerCliente(Number(id));
  if (!cliente) notFound();
  const [planes, ajustes, pagos, tipos] = await Promise.all([obtenerPlanes(), obtenerAjustes(), obtenerPagos(cliente.id), obtenerTipos()]);
  const tipo = nombreTipo(cliente, tipos);

  const plan = planes.find((p) => p.id === cliente.plan_id);
  const cuota = cuotaMensual(cliente, plan, ajustes);
  const limite = limiteProductos(cliente, plan);
  const cobro = estadoCobro(cliente, ajustes.dias_aviso);
  const numero = numeroWhatsApp(cliente.codigo_pais, cliente.celular);
  const celular = formatearCelular(cliente.codigo_pais, cliente.celular);
  const h = hoy();

  const ultimoMensual = pagos.find((p) => p.concepto === "mensualidad") ?? pagos[0];
  const mensajes = [
    { titulo: "Recordatorio de pago", texto: llenarPlantilla(ajustes.plantilla_cobro, datosMensaje(cliente, plan, ajustes)) },
    { titulo: "Aviso de pago vencido", texto: llenarPlantilla(ajustes.plantilla_vencido, datosMensaje(cliente, plan, ajustes)) },
    ...(ultimoMensual
      ? [{
          titulo: "Recibo del último pago",
          texto: llenarPlantilla(
            ajustes.plantilla_recibo,
            datosMensaje(cliente, plan, ajustes, { monto: lempiras(ultimoMensual.monto), fecha_pago: fechaCorta(ultimoMensual.fecha) }),
          ),
        }]
      : []),
  ];
  const total = pagos.reduce((s, p) => s + p.monto, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Volver a clientes</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{cliente.negocio}</h1>
            <p className="text-gray-600">{[tipo, cliente.contacto, celular, cliente.direccion].filter(Boolean).join(" · ")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <InsigniaEstado estado={cliente.estado} />
              <InsigniaCobro estado={cobro.estado} texto={textoCobro(cobro)} />
              {!cliente.instalacion_pagada && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">Instalación pendiente</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {cliente.sitio_url && (
              <a href={cliente.sitio_url} target="_blank" rel="noopener noreferrer" className="boton-secundario">Ver su tienda</a>
            )}
            <BotonAccion
              accion={eliminarCliente.bind(null, cliente.id)}
              confirmacion={`¿Eliminar a “${cliente.negocio}” y todo su historial de pagos? Esto no se puede deshacer.${cliente.tienda_id ? " Su tienda quedará suspendida (sus productos no se borran)." : ""}`}
              className="boton-peligro"
            >
              Eliminar cliente
            </BotonAccion>
          </div>
        </div>
        {nuevo && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Cliente agregado{cliente.tienda_id ? " con su tienda" : ""}. Ya puedes registrar pagos y enviarle mensajes.
          </p>
        )}
        {error_tienda && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">No se creó su tienda: {error_tienda} Corrige el dato y créala abajo en “Tienda en línea”.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          {/* Resumen del plan */}
          <section className="tarjeta">
            <h2 className="mb-3 text-lg font-bold">Plan y cobro</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">Plan</dt><dd className="font-semibold">{plan?.nombre ?? "Sin plan"}</dd></div>
              <div><dt className="text-gray-500">Cuota mensual</dt><dd className="text-xl font-black">{lempiras(cuota)}</dd></div>
              <div><dt className="text-gray-500">Límite de productos</dt><dd className="font-semibold">{limite?.toLocaleString("es-HN") ?? "—"}{cliente.limite_personalizado ? " (especial)" : ""}</dd></div>
              <div><dt className="text-gray-500">Próximo pago</dt><dd className="font-semibold">{fechaCorta(cliente.proximo_pago)}</dd></div>
              <div><dt className="text-gray-500">Dominio</dt><dd className="font-semibold">{cliente.con_dominio ? cliente.dominio || "Sí" : "No incluido"}</dd></div>
              <div><dt className="text-gray-500">Total pagado</dt><dd className="font-semibold">{lempiras(total)}</dd></div>
            </dl>
            <Formulario accion={cambiarPlan} boton="Cambiar plan" className="mt-4 flex flex-wrap items-start gap-2 border-t pt-4" claseBoton="boton-primario">
              <input type="hidden" name="id" value={cliente.id} />
              <select name="plan_id" defaultValue={cliente.plan_id ?? ""} className="campo flex-1">
                <option value="">Sin plan</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} — {lempiras(p.precio_mensual)}/mes · {p.limite_productos.toLocaleString("es-HN")} productos</option>
                ))}
              </select>
            </Formulario>
          </section>

          {/* WhatsApp */}
          <section className="tarjeta">
            <h2 className="mb-1 text-lg font-bold">Mensajes por WhatsApp</h2>
            {!numero ? (
              <p className="text-sm text-gray-600">Agrega el celular del cliente para poder escribirle.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Se abre WhatsApp con el mensaje ya escrito; solo revisa y presiona enviar.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <a href={enlaceWhatsApp(cliente.codigo_pais, cliente.celular, mensajeCobro(cliente, plan, ajustes))} target="_blank" rel="noopener noreferrer" className="boton-whatsapp sm:col-span-2">
                    Cobrar ahora ({cobro.estado === "vencido" ? "pago vencido" : "recordatorio"})
                  </a>
                </div>
                {mensajes.map((m) => (
                  <details key={m.titulo} className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-semibold">{m.titulo}</summary>
                    <p className="mt-2 whitespace-pre-line rounded bg-gray-50 p-2 text-sm text-gray-700">{m.texto}</p>
                    <a href={`https://wa.me/${numero}?text=${encodeURIComponent(m.texto)}`} target="_blank" rel="noopener noreferrer" className="boton-whatsapp mt-2 py-1.5">
                      Enviar este mensaje
                    </a>
                  </details>
                ))}
                <div>
                  <p className="mb-1 text-sm font-semibold">Mensaje libre</p>
                  <MensajeLibre numero={numero} saludo={`Hola ${cliente.contacto || cliente.negocio}, le saluda ${ajustes.nombre_negocio}. `} />
                </div>
              </div>
            )}
          </section>

          {/* Pagos */}
          <section id="pago" className="tarjeta scroll-mt-4">
            <h2 className="mb-3 text-lg font-bold">Registrar pago</h2>
            <Formulario accion={registrarPago} boton="Registrar pago" limpiar>
              <input type="hidden" name="cliente_id" value={cliente.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="etiqueta">Concepto</span>
                  <select name="concepto" defaultValue="mensualidad" className="campo">
                    <option value="mensualidad">Mensualidad</option>
                    <option value="instalacion">Instalación ({lempiras(ajustes.precio_instalacion)})</option>
                    <option value="dominio">Dominio</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
                <label className="block">
                  <span className="etiqueta">Meses que paga</span>
                  <input name="meses" type="number" min={1} max={24} defaultValue={1} className="campo" />
                  <span className="mt-1 block text-xs text-gray-500">Solo para mensualidad: adelanta el próximo pago.</span>
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
                  <input name="metodo" list="metodos" maxLength={40} className="campo" placeholder="Transferencia, efectivo…" />
                  <datalist id="metodos">
                    <option value="Transferencia" /><option value="Efectivo" /><option value="Tigo Money" /><option value="Depósito" />
                  </datalist>
                </label>
                <label className="block">
                  <span className="etiqueta">Nota</span>
                  <input name="nota" maxLength={300} className="campo" />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Con 1 mes, el próximo pago pasa de {fechaCorta(cliente.proximo_pago ?? h)} a {fechaCorta(sumarMeses(cliente.proximo_pago ?? h, 1))}.
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
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <div>
                      <p className="font-semibold">{lempiras(p.monto)} · {NOMBRE_CONCEPTO[p.concepto]}{p.meses > 1 ? ` (${p.meses} meses)` : ""}</p>
                      <p className="text-xs text-gray-500">{[fechaCorta(p.fecha), p.metodo, p.nota].filter(Boolean).join(" · ")}</p>
                    </div>
                    <BotonAccion
                      accion={eliminarPago.bind(null, p.id)}
                      confirmacion={`¿Eliminar este pago de ${lempiras(p.monto)}?${p.meses > 0 ? ` El próximo pago regresará ${p.meses} mes(es).` : ""}`}
                    >
                      Eliminar
                    </BotonAccion>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="tarjeta">
            <h2 className="mb-3 text-lg font-bold">Datos del cliente</h2>
            <FormularioCliente cliente={cliente} planes={planes} tipos={tipos} precioDominio={ajustes.precio_dominio} hoy={h} proximoSugerido={sumarMeses(h, 1)} />
          </section>

          <SeccionTienda cliente={cliente} ajustes={ajustes} />
        </div>
      </div>
    </div>
  );
}
