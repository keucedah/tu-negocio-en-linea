"use client";

import { useState } from "react";
import Formulario from "./Formulario";
import CamposTienda from "./CamposTienda";
import SelectorMunicipio from "./SelectorMunicipio";
import { guardarCliente } from "@/app/admin/acciones";
import { PAISES } from "@/lib/telefono";
import { lempiras } from "@/lib/negocio";
import type { Cliente, Plan, TipoNegocio, Ubicaciones } from "@/lib/panel/types";

export default function FormularioCliente({
  cliente,
  planes,
  tipos,
  precioDominio,
  hoy,
  proximoSugerido,
  tienda,
  ubicaciones,
}: {
  cliente?: Partial<Cliente>;
  /** Departamentos y municipios (2.5). */
  ubicaciones?: Ubicaciones;
  planes: Plan[];
  tipos: TipoNegocio[];
  precioDominio: number;
  hoy: string;
  proximoSugerido: string;
  /** Solo al agregar un cliente: datos para crear su tienda en el mismo paso. */
  tienda?: { claveSugerida: string; urlTiendas: string };
}) {
  const [negocio, setNegocio] = useState(cliente?.negocio ?? "");
  const [correo, setCorreo] = useState(cliente?.correo ?? "");
  const [planId, setPlanId] = useState(String(cliente?.plan_id ?? planes[0]?.id ?? ""));
  const visibles = tipos.filter((t) => t.activo || t.id === cliente?.tipo_negocio_id);
  const [tipoId, setTipoId] = useState(String(cliente?.tipo_negocio_id ?? visibles[0]?.id ?? ""));
  const tipo = tipos.find((t) => String(t.id) === tipoId);
  const esOtro = tipo?.nombre.toLowerCase() === "otro";
  const [conDominio, setConDominio] = useState(cliente?.con_dominio ?? false);
  const plan = planes.find((p) => String(p.id) === planId);
  const cuotaAuto = (plan?.precio_mensual ?? 0) + (conDominio ? precioDominio : 0);

  return (
    <Formulario accion={guardarCliente} boton={cliente?.id ? "Guardar cambios" : "Agregar cliente"}>
      {cliente?.id && <input type="hidden" name="id" value={cliente.id} />}

      <label className="block">
        <span className="etiqueta">Nombre del negocio *</span>
        <input name="negocio" required maxLength={120} value={negocio} onChange={(e) => setNegocio(e.target.value)} className="campo" placeholder="Nombre de su negocio" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Tipo de negocio *</span>
          <select name="tipo_negocio_id" required value={tipoId} onChange={(e) => setTipoId(e.target.value)} className="campo">
            {visibles.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
          {tipo && !esOtro && (
            <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: tipo.color_principal }} />
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: tipo.color_encabezado }} />
              Su tienda empieza con estos colores y sus categorías.
            </span>
          )}
        </label>
        {esOtro && (
          <label className="block">
            <span className="etiqueta">¿Qué tipo de negocio es? *</span>
            <input name="tipo_negocio_otro" required maxLength={60} defaultValue={cliente?.tipo_negocio_otro} className="campo" placeholder="Ej: Taller mecánico, panadería…" />
          </label>
        )}
      </div>
      <label className="block">
        <span className="etiqueta">Persona de contacto</span>
        <input name="contacto" maxLength={120} defaultValue={cliente?.contacto} className="campo" placeholder="Nombre del dueño o encargado" />
      </label>
      <div>
        <span className="etiqueta">Celular / WhatsApp</span>
        <div className="flex gap-2">
          <select name="codigo_pais" defaultValue={cliente?.codigo_pais ?? "504"} className="campo w-40 shrink-0">
            {PAISES.map((p) => (
              <option key={p.codigo} value={p.codigo}>{p.nombre} (+{p.codigo})</option>
            ))}
          </select>
          <input name="celular" inputMode="tel" defaultValue={cliente?.celular} className="campo" placeholder="9999 9999" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Correo</span>
          <input name="correo" type="email" maxLength={120} value={correo} onChange={(e) => setCorreo(e.target.value)} className="campo" />
        </label>
        <label className="block">
          <span className="etiqueta">Dirección de la tienda</span>
          <input name="direccion" maxLength={200} defaultValue={cliente?.direccion} className="campo" placeholder="Barrio El Centro, frente al parque" />
          <span className="mt-1 block text-xs text-gray-500">Sale en el mensaje que recibe el mototaxista.</span>
        </label>
        <label className="block">
          <span className="etiqueta">Dominio propio</span>
          <input name="dominio" maxLength={120} defaultValue={cliente?.dominio} className="campo" placeholder="sunegocio.com" />
          <span className="mt-1 block text-xs text-gray-500">Se activa en su tienda solo si marcas “Incluye dominio web”.</span>
        </label>
      </div>
      {ubicaciones && (
        <SelectorMunicipio
          ubicaciones={ubicaciones}
          valor={cliente?.municipio_id}
          etiqueta="Municipio de la tienda"
          ayuda="En su tienda salen los mototaxistas de este municipio."
        />
      )}
      {cliente?.tienda_id || tienda ? (
        <input type="hidden" name="sitio_url" value={cliente?.sitio_url ?? ""} />
      ) : (
        <label className="block">
          <span className="etiqueta">Enlace de su tienda</span>
          <input name="sitio_url" maxLength={200} defaultValue={cliente?.sitio_url} className="campo" placeholder="https://…" />
        </label>
      )}

      {tienda && (
        <fieldset className="rounded-xl border border-green-200 bg-green-50 p-3">
          <legend className="px-1 text-sm font-bold text-green-800">Tienda en línea</legend>
          <CamposTienda negocio={negocio} correo={correo} claveSugerida={tienda.claveSugerida} urlTiendas={tienda.urlTiendas} />
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-xl border border-marca-100 bg-marca-50 p-3">
        <legend className="px-1 text-sm font-bold text-marca-700">Plan y cobro</legend>
        <label className="block">
          <span className="etiqueta">Plan</span>
          <select name="plan_id" value={planId} onChange={(e) => setPlanId(e.target.value)} className="campo">
            <option value="">Sin plan</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} — {lempiras(p.precio_mensual)}/mes, hasta {p.limite_productos.toLocaleString("es-HN")} productos
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="con_dominio" checked={conDominio} onChange={(e) => setConDominio(e.target.checked)} className="h-4 w-4" />
          Incluye dominio web (+{lempiras(precioDominio)}/mes)
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="etiqueta">Cuota mensual</span>
            <input name="cuota_personalizada" inputMode="decimal" defaultValue={cliente?.cuota_personalizada ?? ""} className="campo" placeholder={`Automática: ${lempiras(cuotaAuto)}`} />
            <span className="mt-1 block text-xs text-gray-500">Déjalo vacío para usar {lempiras(cuotaAuto)}. Escribe otro monto solo si le das un precio especial.</span>
          </label>
          <label className="block">
            <span className="etiqueta">Límite de productos</span>
            <input name="limite_personalizado" inputMode="numeric" defaultValue={cliente?.limite_personalizado ?? ""} className="campo" placeholder={plan ? `Del plan: ${plan.limite_productos.toLocaleString("es-HN")}` : ""} />
            <span className="mt-1 block text-xs text-gray-500">Vacío = el límite del plan.</span>
          </label>
          <label className="block">
            <span className="etiqueta">Estado</span>
            <select name="estado" defaultValue={cliente?.estado ?? "activo"} className="campo">
              <option value="prueba">En prueba</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
          <label className="block">
            <span className="etiqueta">Próximo pago</span>
            <input name="proximo_pago" type="date" defaultValue={cliente?.proximo_pago ?? proximoSugerido} className="campo" />
          </label>
          <label className="block">
            <span className="etiqueta">Cliente desde</span>
            <input name="fecha_inicio" type="date" defaultValue={cliente?.fecha_inicio ?? hoy} className="campo" />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" name="instalacion_pagada" defaultChecked={cliente?.instalacion_pagada ?? false} className="h-4 w-4" />
            Instalación pagada
          </label>
        </div>
      </fieldset>

      <label className="block">
        <span className="etiqueta">Notas</span>
        <textarea name="notas" rows={3} maxLength={2000} defaultValue={cliente?.notas} className="campo" placeholder="Acuerdos, forma de pago preferida, etc." />
      </label>
    </Formulario>
  );
}
