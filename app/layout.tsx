import type { Metadata } from "next";
import "./globals.css";
import { obtenerAjustes } from "@/lib/panel/datos";
import { SITIO } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const a = await obtenerAjustes();
  return {
    // Con esto todas las direcciones relativas (canónica, imágenes) salen con https://www…
    metadataBase: new URL(SITIO),
    title: `Catálogo digital para negocios en Honduras | ${a.nombre_negocio}`,
    description:
      "Crea el catálogo digital de tu negocio en Honduras: tus productos con fotos, tus colores y tu logo, pedidos por WhatsApp, panel de administración y app Android.",
    icons: { icon: "/icono.svg" },
    openGraph: {
      type: "website",
      locale: "es_HN",
      siteName: a.nombre_negocio,
      images: [{ url: "/capturas/tienda.webp", alt: `Tienda en línea hecha con ${a.nombre_negocio}` }],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
