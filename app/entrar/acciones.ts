"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/config";

export async function iniciarSesion(_prev: string | null, formData: FormData): Promise<string | null> {
  if (!supabaseConfigurado) redirect("/admin"); // modo demostración: el panel se ve con datos de ejemplo
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Ingresa tu correo y contraseña.";

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return "Correo o contraseña incorrectos.";
  redirect("/admin");
}

export async function cerrarSesion() {
  if (supabaseConfigurado) {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  }
  redirect("/");
}
