import type { Metadata } from "next";
import "./globals.css";
import { obtenerAjustes } from "@/lib/panel/datos";

export async function generateMetadata(): Promise<Metadata> {
  const a = await obtenerAjustes();
  return {
    title: `${a.nombre_negocio} | ${a.eslogan || "Catálogos en línea"}`,
    description:
      "Catálogo en línea con pedidos por WhatsApp para ferreterías, pulperías, farmacias, boutiques y todo tipo de negocio. Tus colores, tu logo, tu banner y tu app Android.",
    icons: { icon: "/icono.svg" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
