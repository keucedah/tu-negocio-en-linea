import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/tienda/CartProvider";
import Header from "@/components/tienda/Header";
import CartDrawer from "@/components/tienda/CartDrawer";
import WhatsAppFlotante from "@/components/tienda/WhatsAppFlotante";
import { BaseTienda } from "@/components/tienda/BaseTienda";
import { obtenerBase, obtenerTiendaPublica as obtenerTienda } from "@/lib/tienda/datos";
import { variablesTema } from "@/lib/tema";

type Props = { params: Promise<{ tienda: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) return {};
  return {
    title: `${tienda.nombre} | Catálogo`,
    description: `Catálogo de productos de ${tienda.nombre}. Arma tu pedido y envíalo por WhatsApp.`,
    icons: tienda.logoUrl ? { icon: tienda.logoUrl } : undefined,
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const tienda = await obtenerTienda((await params).tienda);
  return tienda ? { themeColor: tienda.colorEncabezado } : {};
}

export default async function LayoutTienda({ params, children }: Props & { children: React.ReactNode }) {
  const tienda = await obtenerTienda((await params).tienda);
  if (!tienda) notFound();
  const base = await obtenerBase();

  return (
    <div className="flex min-h-screen flex-col" style={variablesTema(tienda.colorPrincipal, tienda.colorEncabezado)}>
      <BaseTienda base={base}>
        <CartProvider clave={tienda.slug}>
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
          </footer>
          <WhatsAppFlotante whatsapp={tienda.whatsapp} tienda={tienda.nombre} />
          <CartDrawer whatsapp={tienda.whatsapp} />
        </CartProvider>
      </BaseTienda>
    </div>
  );
}
