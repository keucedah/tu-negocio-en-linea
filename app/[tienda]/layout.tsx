import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/tienda/CartProvider";
import Header from "@/components/tienda/Header";
import CartDrawer from "@/components/tienda/CartDrawer";
import WhatsAppFlotante from "@/components/tienda/WhatsAppFlotante";
import { BaseTienda } from "@/components/tienda/BaseTienda";
import { obtenerBase, obtenerTiendaPublica as obtenerTienda } from "@/lib/tienda/datos";
import { variablesTema } from "@/lib/tema";
import { resumen, SITIO, urlTienda } from "@/lib/seo";
import { obtenerMototaxis } from "@/lib/mototaxis";

type Props = { params: Promise<{ tienda: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) return {};
  const portada = tienda.textoPortada.trim();
  const pedido = /whatsapp/i.test(portada) ? "" : " Arma tu pedido y envíalo por WhatsApp.";
  const descripcion = resumen(`${tienda.nombre}: ${portada}${pedido}`);
  const imagen = tienda.banners[0]?.pc ?? tienda.logoUrl;
  return {
    title: `${tienda.nombre} | Catálogo en línea`,
    description: descripcion,
    icons: tienda.logoUrl ? { icon: tienda.logoUrl } : undefined,
    // Dirección oficial: su dominio propio o la plataforma + /tienda (las páginas de producto ponen la suya)
    alternates: { canonical: urlTienda(tienda) },
    openGraph: {
      type: "website",
      locale: "es_HN",
      siteName: tienda.nombre,
      title: tienda.nombre,
      description: descripcion,
      url: urlTienda(tienda),
      images: imagen ? [{ url: imagen, alt: tienda.nombre }] : undefined,
    },
    // Una tienda suspendida no debe salir en Google
    robots: tienda.activa ? undefined : { index: false, follow: false },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const tienda = await obtenerTienda((await params).tienda);
  return tienda ? { themeColor: tienda.colorEncabezado } : {};
}

export default async function LayoutTienda({ params, children }: Props & { children: React.ReactNode }) {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) notFound();
  const [base, mototaxis] = await Promise.all([
    obtenerBase(),
    // "Enviar con mototaxi": solo si la tienda lo ofrece y tiene municipio
    tienda.activa && tienda.ofreceMototaxi && tienda.municipioId ? obtenerMototaxis(tienda.id) : Promise.resolve([]),
  ]);

  return (
    <div className="flex min-h-screen flex-col" style={variablesTema(tienda.colorPrincipal, tienda.colorEncabezado)}>
      <BaseTienda base={base}>
        <CartProvider clave={tienda.slug} palabra={tienda.palabraMedida}>
          <Header tienda={tienda} />
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-white py-6 text-center text-xs text-gray-500">
            {tienda.celularFormateado && (
              <p className="mb-1 text-sm text-gray-700">
                WhatsApp y llamadas:{" "}
                <a href={`https://wa.me/${tienda.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-marca-700 hover:underline">
                  {tienda.celularFormateado}
                </a>
              </p>
            )}
            © {new Date().getFullYear()} {tienda.nombre}. Precios y disponibilidad por WhatsApp.
            <a href={`${SITIO}/privacidad`} className="ml-2 underline hover:text-gray-700">Privacidad</a>
          </footer>
          <WhatsAppFlotante whatsapp={tienda.whatsapp} tienda={tienda.nombre} />
          <CartDrawer
            whatsapp={tienda.whatsapp}
            mototaxis={mototaxis}
            tienda={{ nombre: tienda.nombre, direccion: tienda.direccion, municipio: tienda.municipio, color: tienda.colorPrincipal, whatsapp: tienda.whatsapp }}
          />
        </CartProvider>
      </BaseTienda>
    </div>
  );
}
