"use client";

import { useState } from "react";
import { sugerirSlug, validarSlug } from "@/lib/slug";

/** Dirección, correo y contraseña de la tienda en línea del cliente. */
export default function CamposTienda({
  negocio,
  correo,
  claveSugerida,
  urlTiendas,
}: {
  negocio: string;
  correo: string;
  claveSugerida: string;
  urlTiendas: string;
}) {
  const [slugEditado, setSlugEditado] = useState<string | null>(null);
  const slug = slugEditado ?? sugerirSlug(negocio);
  const error = slug ? validarSlug(slug) : null;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="etiqueta">Dirección de la tienda</span>
        <input
          name="slug"
          value={slug}
          onChange={(e) => setSlugEditado(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          maxLength={40}
          className="campo"
          placeholder="ferreteria-el-constructor"
        />
        <span className={`mt-1 block break-all text-xs ${error ? "text-red-600" : "text-gray-500"}`}>
          {error ?? (slug ? `Su enlace será ${urlTiendas || "…"}/${slug}` : "Déjalo vacío para crear la tienda después.")}
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="etiqueta">Correo para entrar a su tienda</span>
          <input name="correo_dueno" type="email" maxLength={120} className="campo" placeholder={correo || "correo@ejemplo.com"} />
          <span className="mt-1 block text-xs text-gray-500">Vacío = el correo del cliente.</span>
        </label>
        <label className="block">
          <span className="etiqueta">Contraseña inicial</span>
          <input name="clave" defaultValue={claveSugerida} minLength={8} maxLength={72} className="campo font-mono" autoComplete="off" />
          <span className="mt-1 block text-xs text-gray-500">Mínimo 8 caracteres. Se la envías por WhatsApp.</span>
        </label>
      </div>
    </div>
  );
}
