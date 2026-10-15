import { NextResponse } from "next/server";
import { crearClientePublico } from "@/lib/supabase/publico";
import { supabaseConfigurado } from "@/lib/config";

// Contadores (2.5): veces que eligen a un mototaxista, y vistas y clics de la publicidad.
// Llega con navigator.sendBeacon, así no retrasa al cliente.
export async function POST(req: Request) {
  if (!supabaseConfigurado) return new NextResponse(null, { status: 204 });
  let cuerpo: { tipo?: string; id?: number };
  try {
    cuerpo = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const id = Number(cuerpo.id);
  if (!Number.isInteger(id) || id <= 0) return new NextResponse(null, { status: 400 });
  const sb = crearClientePublico();
  if (cuerpo.tipo === "mototaxi") await sb.rpc("contar_mototaxi", { p_id: id });
  else if (cuerpo.tipo === "vista" || cuerpo.tipo === "clic") await sb.rpc("contar_publicidad", { p_id: id, p_clic: cuerpo.tipo === "clic" });
  else return new NextResponse(null, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
