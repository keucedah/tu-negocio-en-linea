"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/app/acciones-entrar-tienda";

export default function Entrar() {
  const [error, accion, enviando] = useActionState(iniciarSesion, null);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <form action={accion} className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Acceso administrador</h1>
          <p className="mt-1 text-sm text-gray-500">Solo para el personal de la tienda.</p>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Correo</span>
          <input name="email" type="email" autoComplete="username" required className="campo" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Contraseña</span>
          <input name="password" type="password" autoComplete="current-password" required className="campo" />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={enviando} className="boton-primario w-full">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
