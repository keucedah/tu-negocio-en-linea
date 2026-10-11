"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/config";
import { obtenerBase } from "@/lib/tienda/datos";

export async function iniciarSesion(_prev: string | null, formData: FormData): Promise<string | null> {
  if (!supabaseConfigurado) return "El sitio está en modo demostración: falta conectar Supabase.";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Ingresa tu correo y contraseña.";

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Correo o contraseña incorrectos.";
  redirect(`${await obtenerBase()}/admin`);
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect((await obtenerBase()) || "/");
}
