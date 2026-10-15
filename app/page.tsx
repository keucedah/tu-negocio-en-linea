import type { Metadata } from "next";
import Link from "next/link";
import FormularioDemo from "@/components/panel/FormularioDemo";
import Celular from "@/components/panel/Celular";
import CelularAnimado from "@/components/panel/CelularAnimado";
import Revelar from "@/components/Revelar";
import Anuncios from "@/components/tienda/Anuncios";
import { obtenerAnunciosInicio } from "@/lib/anuncios";
import Marca, { Simbolo } from "@/components/Marca";
import {
  IcoBolsa, IcoCaja, IcoCarrito, IcoCategorias, IcoCelular, IcoCheck, IcoCorreo, IcoEngrane, IcoEstrella, IcoGlobo, IcoImagen, IcoPaleta, IcoUbicacion, IcoWhatsApp,
} from "@/components/panel/Iconos";
import { obtenerAjustes, obtenerPlanesPublicos as obtenerPlanes, obtenerTipos } from "@/lib/panel/datos";
import { COLOR_PLAN } from "@/lib/panel/colores";
import { lempiras } from "@/lib/negocio";
import { formatearCelular, numeroWhatsApp } from "@/lib/telefono";
import { SITIO } from "@/lib/seo";

export const revalidate = 60;

// La página principal es la dirección oficial con www (las demás variantes apuntan aquí)
export const metadata: Metadata = { alternates: { canonical: "/" } };

const FUNCIONES = [
  { icono: IcoCaja, titulo: "Catálogo de productos", texto: "Tus productos con foto, descripción y búsqueda por nombre." },
  { icono: IcoEstrella, titulo: "Lo más vendido", texto: "Elige tus productos estrella y salen en un carrusel arriba de tu tienda." },
  { icono: IcoPaleta, titulo: "Tus colores y tu logo", texto: "Escoge los colores de tu marca y sube tu logo. Tu tienda se ve como tú." },
  { icono: IcoImagen, titulo: "Banner de portada", texto: "Una foto grande con tu mensaje: ofertas, temporada o lo que quieras destacar." },
  { icono: IcoCarrito, titulo: "Carrito de pedidos", texto: "Tus clientes arman su lista con cantidades desde el celular." },
  { icono: IcoWhatsApp, titulo: "Pedidos por WhatsApp", texto: "El pedido te llega listo a tu WhatsApp con un solo toque." },
  { icono: IcoCategorias, titulo: "Categorías para tu rubro", texto: "Tu tienda empieza con las categorías de tu tipo de negocio." },
  { icono: IcoCelular, titulo: "App Android con tu marca", texto: "Tus clientes ven tu catálogo en su celular, aun sin internet." },
];

const INSTALACION = [
  "Tu tienda en línea lista con tu dirección",
  "Diseño según tu tipo de negocio",
  "Tus colores, logo y banner",
  "Conexión con tu WhatsApp",
  "Categorías iniciales de tu rubro",
  "Capacitación básica del panel",
];

const CAPTURAS = [
  { src: "/capturas/tienda.webp", titulo: "Tu tienda con tu banner" },
  { src: "/capturas/mas-vendido.webp", titulo: "Lo más vendido" },
  { src: "/capturas/pedido.webp", titulo: "Pedido por WhatsApp" },
  { src: "/capturas/panel-productos.webp", titulo: "Panel: tus productos" },
  { src: "/capturas/panel-apariencia.webp", titulo: "Panel: tus colores" },
];

export default async function Inicio() {
  const [ajustes, planes, tipos, anuncios] = await Promise.all([obtenerAjustes(), obtenerPlanes(), obtenerTipos(), obtenerAnunciosInicio()]);
  const rubros = tipos.filter((t) => t.activo && t.nombre.toLowerCase() !== "otro");
  const whatsapp = numeroWhatsApp(ajustes.codigo_pais, ajustes.celular);
  const celular = formatearCelular(ajustes.codigo_pais, ajustes.celular);
  const enlaceDemo = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola, quiero información sobre la tienda en línea para mi negocio.")}`
    : "#contacto";
  const visibles = planes.filter((p) => p.visible);
  // Con tres planes o más se resalta el del medio como recomendado
  const recomendado = visibles.length >= 3 ? visibles[Math.floor((visibles.length - 1) / 2)].id : null;

  // Datos para Google: quién es el negocio y cómo contactarlo
  const datosGoogle = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ajustes.nombre_negocio,
    url: SITIO + "/",
    logo: SITIO + "/icono.svg",
    description: "Catálogos digitales con pedidos por WhatsApp y app Android para negocios en Honduras.",
    areaServed: "HN",
    ...(whatsapp && { contactPoint: { "@type": "ContactPoint", telephone: "+" + whatsapp, contactType: "sales", availableLanguage: "es" } }),
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosGoogle).replace(/</g, "\\u003c") }} />
      {/* Encabezado */}
      <header className="sticky top-0 z-30 border-b border-marino-800 bg-marino-900/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <a href="#" className="min-w-0">
            <Marca nombre={ajustes.nombre_negocio} eslogan={ajustes.eslogan} claro />
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-200 md:flex">
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#planes" className="hover:text-white">Planes</a>
            <a href="#contacto" className="hover:text-white">Contacto</a>
          </nav>
          <a href={enlaceDemo} target="_blank" rel="noopener noreferrer" className="boton-whatsapp">
            <IcoWhatsApp className="h-5 w-5" />
            <span className="hidden sm:inline">Escríbenos</span>
          </a>
        </div>
      </header>

      {/* Portada */}
      <section className="relative overflow-hidden bg-gradient-to-br from-marino-950 via-marino-900 to-marino-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-4xl font-black uppercase leading-tight sm:text-5xl">
              Tu negocio <span className="block text-marca-400">en línea</span>
            </h1>
            <p className="mt-4 inline-block rounded-full bg-marca-500 px-4 py-1.5 text-sm font-bold sm:text-base">
              Catálogo web + App Android + Panel de tu tienda
            </p>
            <p className="mt-5 text-lg text-gray-200">
              El catálogo digital para negocios en Honduras: muestra tus productos con tus colores, tu logo y tu banner. Tus clientes
              eligen y te mandan el pedido por WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={enlaceDemo} target="_blank" rel="noopener noreferrer" className="boton-whatsapp px-5 py-3 text-base">
                <IcoWhatsApp className="h-5 w-5" /> Solicita una demostración
              </a>
              <a href="#planes" className="boton border border-white/30 px-5 py-3 text-base text-white hover:bg-white/10">
                Ver planes y precios
              </a>
            </div>
            {rubros.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-300">Diseñado para:</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {rubros.map((t) => (
                    <li key={t.id} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-100 ring-1 ring-white/15">{t.nombre}</li>
                  ))}
                  <li className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-gray-100 ring-1 ring-white/15">y más</li>
                </ul>
              </div>
            )}
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <CelularAnimado />
            <Simbolo className="absolute -left-2 top-4 hidden h-24 w-24 drop-shadow-xl sm:block" />
          </div>
        </div>
      </section>

      {/* Anuncios (sorteos, promociones) marcados para la página principal */}
      {anuncios.anuncios.length > 0 && (
        <div className="pb-6">
          <Anuncios anuncios={anuncios.anuncios} whatsapp={anuncios.whatsapp} origen={`la página de ${ajustes.nombre_negocio}`} />
        </div>
      )}

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-16 bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-marino-900">Todo lo que incluye</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">Tu tienda lista y funcionando, fácil de usar para ti y para tus clientes.</p>
          <Revelar className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="tarjeta-plan rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${titulo.includes("WhatsApp") ? "bg-[#25D366]" : "bg-marca-500"}`}>
                  <Icono />
                </span>
                <h3 className="mt-3 font-bold">{titulo}</h3>
                <p className="mt-1 text-sm text-gray-600">{texto}</p>
              </div>
            ))}
          </Revelar>
        </div>
      </section>

      {/* Capturas */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-marino-900">Así se ve</h2>
          <Revelar className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {CAPTURAS.map((c) => (
              <figure key={c.titulo} className="text-center">
                <Celular src={c.src} alt={c.titulo} />
                <figcaption className="mx-auto mt-2 inline-block rounded-full bg-marca-500 px-4 py-1.5 text-sm font-bold text-white">{c.titulo}</figcaption>
              </figure>
            ))}
          </Revelar>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="scroll-mt-16 bg-marino-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black">Planes y precios</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-300">Un solo pago de instalación y una mensualidad según la cantidad de productos.</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="tarjeta-plan rounded-2xl bg-white p-6 text-gray-900">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marino-800 text-white"><IcoEngrane /></span>
                <h3 className="text-lg font-bold">Instalación y configuración</h3>
              </div>
              <p className="mt-4 inline-block rounded-full bg-yellow-300 px-3 py-1 text-sm font-bold">Pago único</p>
              <p className="mt-2 text-5xl font-black text-marino-900">{lempiras(ajustes.precio_instalacion)}</p>
              <ul className="mt-5 space-y-2">
                {INSTALACION.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm"><IcoCheck className="mt-0.5 h-5 w-5 shrink-0" />{t}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-lg font-bold">
                Mensualidad <span className="font-normal text-gray-300">según la cantidad de productos</span>
              </p>
              <Revelar className="grid gap-4 pt-3 sm:grid-cols-3">
                {visibles.map((p) => {
                  const c = COLOR_PLAN[p.color];
                  const destacado = p.id === recomendado;
                  return (
                    <div
                      key={p.id}
                      className={`tarjeta-plan relative rounded-2xl bg-white text-gray-900 ${destacado ? "ring-4 ring-yellow-300 sm:-mt-3 sm:mb-3" : ""}`}
                    >
                      {destacado && (
                        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-300 px-3 py-0.5 text-xs font-black uppercase tracking-wide text-marino-900 shadow">
                          Recomendado
                        </span>
                      )}
                      <div className={`${c.cabecera} rounded-t-2xl px-4 py-3 text-center text-white`}>
                        <p className="text-xl font-black">{p.nombre}</p>
                        {p.subtitulo && <p className="text-xs opacity-90">{p.subtitulo}</p>}
                      </div>
                      <div className="p-4">
                        <p className="text-center text-4xl font-black">{lempiras(p.precio_mensual)}</p>
                        <p className="text-center text-sm text-gray-500">/mes</p>
                        <ul className="mt-4 space-y-2 text-sm">
                          <li className="flex items-start gap-2"><IcoCheck className="mt-0.5 h-5 w-5 shrink-0" />Hasta {p.limite_productos.toLocaleString("es-HN")} productos</li>
                          {p.caracteristicas.split("\n").filter(Boolean).map((t) => (
                            <li key={t} className="flex items-start gap-2"><IcoCheck className="mt-0.5 h-5 w-5 shrink-0" />{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </Revelar>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-gray-900">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marino-800 text-white"><IcoGlobo /></span>
                  <div>
                    <p className="font-bold">Dominio web <span className="ml-1 rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">Pago mensual</span></p>
                    <p className="text-2xl font-black">{lempiras(ajustes.precio_dominio)} <span className="text-sm font-normal text-gray-500">/mes</span></p>
                    <p className="text-xs text-gray-600">Registro y gestión del dominio (por ejemplo: tunegocio.com)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-yellow-50 p-4 text-sm text-gray-800">
                  <IcoBolsa className="h-10 w-10 shrink-0 text-gray-800" />
                  Los precios pueden estar sujetos a cambio dependiendo de la devaluación de la moneda y el incremento en el costo de los servidores y servicios externos (Supabase, dominio, etc.).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Contacto */}
      <section id="contacto" className="scroll-mt-16 py-16">
        <Revelar className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-marino-900">Solicita una demostración</h2>
            <p className="mt-2 text-gray-600">Te mostramos cómo quedaría la tienda de tu negocio, sin compromiso.</p>
            <ul className="mt-6 space-y-4">
              {celular && (
                <li>
                  <a href={enlaceDemo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-[#25D366] p-4 text-white shadow hover:bg-[#1ebe5a]">
                    <IcoWhatsApp className="h-10 w-10" />
                    <span>
                      <span className="block text-sm">WhatsApp y llamadas</span>
                      <span className="text-2xl font-black">{celular}</span>
                    </span>
                  </a>
                </li>
              )}
              {ajustes.direccion && (
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marca-100 text-marca-700"><IcoUbicacion className="h-5 w-5" /></span>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ajustes.direccion)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{ajustes.direccion}</a>
                </li>
              )}
              {ajustes.correo && (
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marca-100 text-marca-700"><IcoCorreo className="h-5 w-5" /></span>
                  <a href={`mailto:${ajustes.correo}`} className="break-all hover:underline">{ajustes.correo}</a>
                </li>
              )}
            </ul>
          </div>
          <div className="tarjeta">
            <FormularioDemo whatsapp={whatsapp} />
          </div>
        </Revelar>
      </section>

      <footer className="bg-marino-950 py-8 text-center text-sm text-gray-400">
        <Simbolo className="mx-auto mb-3 h-14 w-14" />
        <p className="font-bold text-gray-200">{ajustes.nombre_negocio}</p>
        {ajustes.eslogan && <p className="text-xs">{ajustes.eslogan}</p>}
        <p className="mt-2">© {new Date().getFullYear()} {ajustes.direccion}</p>
        {/* Acceso discreto para el administrador */}
        <Link href="/entrar" className="mt-3 inline-block text-xs uppercase tracking-wider text-gray-600 hover:text-gray-300">
          Entrar
        </Link>
      </footer>
    </div>
  );
}
