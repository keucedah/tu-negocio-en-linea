"use client";

import { createContext, useContext } from "react";

// Inicio de los enlaces de la tienda actual: "/ana" o "" con dominio propio.
const Ctx = createContext("");

export function BaseTienda({ base, children }: { base: string; children: React.ReactNode }) {
  return <Ctx.Provider value={base}>{children}</Ctx.Provider>;
}

export function useBase() {
  return useContext(Ctx);
}
