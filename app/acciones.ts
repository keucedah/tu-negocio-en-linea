"use server";

import { crearClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/config";

export type ResultadoSolicitud = { ok: boolean; mensaje: string } | null;

/** Guarda una solicitud de demostración enviada desde la página pública. */
export async function enviarSolicitud(_prev: ResultadoSolicitud, formData: FormData): Promise<ResultadoSolicitud> {
  const nombre = String(formData.get("nombre") ?? "").trim().slice(0, 80);
  const negocio = String(formData.get("negocio") ?? "").trim().slice(0, 120);
  const celular = String(formData.get("celular") ?? "").replace(/[^0-9+ ]/g, "").trim().slice(0, 20);
  const mensaje = String(formData.get("mensaje") ?? "").trim().slice(0, 500);
  if (!nombre) return { ok: false, mensaje: "Escribe tu nombre." };
  if (celular.replace(/\D/g, "").length < 8) return { ok: false, mensaje: "Escribe un celular válido para poder contactarte." };

  if (supabaseConfigurado) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.from("solicitudes_demo").insert({ nombre, negocio, celular, mensaje });
    if (error) return { ok: false, mensaje: "No se pudo enviar. Escríbenos directo por WhatsApp." };
  }
  return { ok: true, mensaje: "¡Recibimos tu solicitud! Te contactaremos pronto." };
}
