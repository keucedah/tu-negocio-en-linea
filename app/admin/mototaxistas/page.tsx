import Link from "next/link";
import ListaMototaxistas from "@/components/panel/ListaMototaxistas";
import GestionMunicipios from "@/components/panel/GestionMunicipios";
import { obtenerAjustes, obtenerClientes } from "@/lib/panel/datos";
import { CLASE_ESTADO_MOTO, cuotaMototaxi, estadoMototaxi, mensajeCobroMototaxi, obtenerMototaxistas } from "@/lib/panel/mototaxis";
import { nombreMunicipio, obtenerUbicaciones } from "@/lib/panel/ubicaciones";
import { enlaceWhatsApp, fechaCorta, lempiras } from "@/lib/negocio";
import { formatearCelular } from "@/lib/telefono";
import { urlSitio } from "@/lib/url";

export default async function Mototaxistas() {
  const [lista, ajustes, ubicaciones, clientes, sitio] = await Promise.all([
    obtenerMototaxistas(), obtenerAjustes(), obtenerUbicaciones(), obtenerClientes(), urlSitio(),
  ]);

  if (lista === null) {
    return (
      <div className="tarjeta mx-auto max-w-xl text-center">
        <h1 className="text-xl font-bold">Mototaxistas</h1>
        <p className="mt-2 text-gray-600">
          Para usar esta sección, ejecuta primero <b>actualizacion-2.5.sql</b> en Supabase (proyecto <b>tu-negocio-en-linea</b>) y recarga la página.
        </p>
      </div>
    );
  }

  const filas = lista.map((m) => {
    const e = estadoMototaxi(m, ajustes.dias_aviso);
    const extra = m.municipios_extra.map((id) => nombreMunicipio(id, ubicaciones).split(",")[0]).filter(Boolean);
    return {
      id: m.id,
      codigo: m.codigo,
      nombre: m.nombre,
      celular: formatearCelular(m.codigo_pais, m.celular),
      numero: m.numero_mototaxi,
      foto: m.foto_url,
      municipio: [nombreMunicipio(m.municipio_id, ubicaciones), extra.length ? `también ${extra.join(", ")}` : ""].filter(Boolean).join(" · "),
      municipioIds: [m.municipio_id ?? 0, ...m.municipios_extra],
      estado: e.estado,
      textoEstado: e.texto,
      claseEstado: CLASE_ESTADO_MOTO[e.estado],
      pagadoHasta: fechaCorta(m.pagado_hasta),
      cuota: lempiras(cuotaMototaxi(m, ajustes)),
      elegido: m.veces_elegido,
      sinPermiso: !m.acepto_publicar,
      enlaceCobro: enlaceWhatsApp(m.codigo_pais, m.celular, mensajeCobroMototaxi(m, ajustes, `${sitio}/mototaxi/${m.token}`)),
    };
  });

  const usos: Record<number, number> = {};
  const sumar = (id: number | null | undefined) => {
    if (id) usos[id] = (usos[id] ?? 0) + 1;
  };
  lista.forEach((m) => [m.municipio_id, ...m.municipios_extra].forEach(sumar));
  clientes.forEach((c) => sumar(c.municipio_id));
  const conMototaxis = ubicaciones.municipios.filter((m) => filas.some((f) => f.municipioIds.includes(m.id)));

  const cuenta = (p: (e: string) => boolean) => filas.filter((f) => p(f.estado)).length;
  const visibles = filas.filter((f) => (f.estado === "al_dia" || f.estado === "por_vencer") && !f.sinPermiso).length;
  const tarjetas = [
    { titulo: "Visibles en tiendas", valor: visibles, clase: "text-green-700", nota: "Al día y con permiso" },
    { titulo: "Por vencer", valor: cuenta((e) => e === "por_vencer"), clase: "text-yellow-600", nota: `Próximos ${ajustes.dias_aviso} días` },
    { titulo: "Suspendidos", valor: cuenta((e) => e === "vencido" || e === "sin_pagos"), clase: "text-red-600", nota: "Vencidos o sin pagos" },
    { titulo: "Mensualidad", valor: lempiras(ajustes.cuota_mototaxi), nota: "Se cambia en Ajustes" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.titulo} className="tarjeta">
            <p className="text-sm text-gray-500">{t.titulo}</p>
            <p className={`mt-1 text-2xl font-black ${t.clase ?? ""}`}>{t.valor}</p>
            {t.nota && <p className="text-xs text-gray-500">{t.nota}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mototaxistas</h1>
          <p className="text-sm text-gray-600">Salen en el carrito de las tiendas de su municipio. Si su mensualidad vence, aparecen en gris como “Suspendido” hasta que paguen.</p>
        </div>
        <Link href="/admin/mototaxistas/nuevo" className="boton-primario">+ Agregar mototaxista</Link>
      </div>

      {filas.length === 0 ? (
        <div className="tarjeta text-center text-gray-600">
          Aún no hay mototaxistas. <Link href="/admin/mototaxistas/nuevo" className="font-semibold text-marca-700 hover:underline">Agrega el primero</Link>.
        </div>
      ) : (
        <ListaMototaxistas filas={filas} municipios={conMototaxis.map((m) => ({ id: m.id, nombre: m.nombre }))} />
      )}

      <section className="tarjeta max-w-3xl">
        <h2 className="text-lg font-bold">Municipios</h2>
        <p className="mb-3 text-sm text-gray-600">
          Los que agregues aquí (o con “+ Nuevo municipio” en un formulario) se pueden elegir para tiendas y mototaxistas. No se repiten aunque los escribas con o sin tilde.
        </p>
        <GestionMunicipios ubicaciones={ubicaciones} usos={usos} />
      </section>
    </div>
  );
}
