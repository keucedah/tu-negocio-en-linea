
import type { Metadata } from "next";
import "./globals.css";
import { obtenerAjustes } from "@/lib/panel/datos";

export async function generateMetadata(): Promise<Metadata> {
  const a = await obtenerAjustes();

  return {
    metadataBase: new URL("https://www.tunegocioenlineahn.com"),
    title:
      "Catálogo Digital para Negocios en Honduras | Tu Negocio en Línea HN",
    description:
      "Crea tu catálogo digital con tus productos, logo y colores. Recibe solicitudes de pedidos por WhatsApp y ofrece una app Android para tu negocio. Solicita una demostración en Honduras.",
    icons: { icon: "/icono.svg" },
    openGraph: {
      type: "website",
      locale: "es_HN",
      siteName: a.nombre_negocio || "Tu Negocio en Línea HN",
      title:
        "Catálogo Digital para Negocios en Honduras | Tu Negocio en Línea HN",
      description:
        "Muestra tus productos en un catálogo digital personalizado y recibe solicitudes por WhatsApp. Una solución para negocios en Honduras.",
      url: "https://www.tunegocioenlineahn.com/",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
