// Datos de ejemplo para el modo demostración (sin Supabase).
import { hoy, sumarMeses } from "../negocio";
import type { Ajustes, Cliente, Pago, Plan, Solicitud, TipoNegocio } from "./types";

const caracteristicas = "Imágenes optimizadas en WebP\nAlmacenamiento en la nube (Supabase)\nCatálogo y panel administrativo";

export const planesDemo: Plan[] = [
  { id: 1, nombre: "Básico", subtitulo: "Para negocios pequeños", precio_mensual: 250, limite_productos: 2000, caracteristicas, color: "azul", orden: 1, visible: true },
  { id: 2, nombre: "Pro", subtitulo: "Negocios en crecimiento", precio_mensual: 500, limite_productos: 10000, caracteristicas, color: "naranja", orden: 2, visible: true },
  { id: 3, nombre: "Pro Plus", subtitulo: "Alto volumen", precio_mensual: 800, limite_productos: 50000, caracteristicas, color: "verde", orden: 3, visible: true },
];

export const ajustesDemo: Ajustes = {
  nombre_negocio: "Tu Negocio en Línea HN",
  eslogan: "Plataforma SaaS de catálogos en línea",
  codigo_pais: "504",
  celular: "88839869",
  correo: "kenrakasth2009@gmail.com",
  direccion: "Barrio El Calvario, Langue, Valle, Honduras",
  precio_instalacion: 2500,
  precio_dominio: 135,
  dias_aviso: 5,
  plantilla_cobro:
    "Hola {contacto}, le saluda {mi_negocio}.\nLe recordamos que el pago mensual de su tienda en línea ({negocio}) por *{monto}* ({plan}) vence el *{fecha}*.\nPuede pagar por transferencia o en efectivo. Al pagar, envíenos el comprobante por aquí. ¡Gracias por su preferencia!",
  plantilla_vencido:
    "Hola {contacto}, le saluda {mi_negocio}.\nEl pago de su tienda en línea ({negocio}) por *{monto}* venció el *{fecha}*.\nPara evitar la suspensión del servicio, le pedimos realizar el pago a la brevedad. Si ya pagó, envíenos el comprobante y disculpe la molestia.",
  plantilla_recibo:
    "Hola {contacto}, le saluda {mi_negocio}.\nConfirmamos su pago de *{monto}* recibido el {fecha_pago}.\nSu próximo pago es el *{fecha}*. ¡Gracias!",
};

const h = hoy();
const dias = (n: number) => new Date(Date.parse(h + "T00:00:00Z") + n * 86400000).toISOString().slice(0, 10);

function cliente(id: number, c: Partial<Cliente> & Pick<Cliente, "negocio">): Cliente {
  return {
    id,
    contacto: "",
    codigo_pais: "504",
    celular: "",
    correo: "",
    direccion: "",
    sitio_url: "",
    dominio: "",
    plan_id: 1,
    con_dominio: false,
    limite_personalizado: null,
    cuota_personalizada: null,
    estado: "activo",
    fecha_inicio: sumarMeses(h, -4),
    proximo_pago: dias(20),
    instalacion_pagada: true,
    notas: "",
    tipo_negocio_id: 1,
    tipo_negocio_otro: "",
    tienda_id: null,
    creado_en: sumarMeses(h, -4) + "T12:00:00Z",
    ...c,
  };
}

export const clientesDemo: Cliente[] = [
  cliente(1, { negocio: "Ferretería El Constructor", contacto: "Carlos Martínez", celular: "99887766", direccion: "Nacaome, Valle", plan_id: 2, con_dominio: true, dominio: "elconstructorhn.com", sitio_url: "https://elconstructorhn.com", proximo_pago: dias(-3) }),
  cliente(2, { negocio: "Boutique Lagos", contacto: "Ana Lagos", tipo_negocio_id: 3, celular: "33445566", direccion: "San Lorenzo, Valle", plan_id: 1, proximo_pago: dias(2) }),
  cliente(3, { negocio: "Farmacia Central", contacto: "José Rivera", tipo_negocio_id: 5, celular: "97776655", direccion: "Choluteca", plan_id: 3, con_dominio: true, dominio: "farmaciacentral.hn", proximo_pago: dias(18) }),
  cliente(4, { negocio: "Pulpería San Juan", contacto: "María Flores", tipo_negocio_id: 2, celular: "88112233", direccion: "Langue, Valle", plan_id: 1, estado: "prueba", instalacion_pagada: false, proximo_pago: dias(9), notas: "Probando 15 días antes de pagar la instalación." }),
  cliente(5, { negocio: "Taller y Repuestos Aguilar", contacto: "Luis Aguilar", tipo_negocio_id: 11, tipo_negocio_otro: "Taller mecánico", celular: "94556677", direccion: "Goascorán, Valle", plan_id: 2, estado: "suspendido", proximo_pago: dias(-35), notas: "Suspendido por falta de pago." }),
];

export const pagosDemo: Pago[] = [
  { id: 1, cliente_id: 1, fecha: sumarMeses(h, -4), monto: 2500, concepto: "instalacion", meses: 0, metodo: "Transferencia", nota: "", serie_recibo: "FEEC", numero_recibo: 1, plan_nombre: "Pro", pagado_hasta: null },
  { id: 2, cliente_id: 1, fecha: dias(-33), monto: 635, concepto: "mensualidad", meses: 1, metodo: "Transferencia", nota: "Plan Pro + dominio", serie_recibo: "FEEC", numero_recibo: 2, plan_nombre: "Pro", pagado_hasta: dias(-3) },
  { id: 3, cliente_id: 2, fecha: dias(-28), monto: 250, concepto: "mensualidad", meses: 1, metodo: "Efectivo", nota: "", serie_recibo: "BOLA", numero_recibo: 1, plan_nombre: "Básico", pagado_hasta: dias(2) },
  { id: 4, cliente_id: 3, fecha: dias(-12), monto: 935, concepto: "mensualidad", meses: 1, metodo: "Tigo Money", nota: "", serie_recibo: "FCEN", numero_recibo: 2, plan_nombre: "Pro Plus", pagado_hasta: dias(18) },
  { id: 5, cliente_id: 3, fecha: dias(-12), monto: 2500, concepto: "instalacion", meses: 0, metodo: "Transferencia", nota: "", serie_recibo: "FCEN", numero_recibo: 1, plan_nombre: "Pro Plus", pagado_hasta: null },
];

export const solicitudesDemo: Solicitud[] = [
  { id: 1, nombre: "Pedro Gómez", negocio: "Librería Gómez", celular: "+504 9876 5432", mensaje: "Quiero ver una demostración del catálogo.", atendida: false, creado_en: dias(-1) + "T15:30:00Z" },
];

export const tiposDemo: TipoNegocio[] = [
  {
    "id": 1,
    "nombre": "Ferretería",
    "color_principal": "#ea580c",
    "color_encabezado": "#111827",
    "titulo_portada": "Todo para tu obra y tu hogar",
    "texto_portada": "Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.",
    "texto_buscador": "Busca martillo, tornillos, pintura…",
    "categorias": "Herramientas manuales\nHerramientas eléctricas\nTornillería y fijaciones\nPinturas\nElectricidad\nPlomería",
    "orden": 1,
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Abarrotería / pulpería",
    "color_principal": "#16a34a",
    "color_encabezado": "#14532d",
    "titulo_portada": "Todo para tu despensa",
    "texto_portada": "Granos, lácteos, bebidas y productos de limpieza. Haz tu pedido por WhatsApp y te lo tenemos listo.",
    "texto_buscador": "Busca arroz, aceite, jabón…",
    "categorias": "Granos básicos\nLácteos y huevos\nBebidas\nSnacks y dulces\nLimpieza\nCuidado personal",
    "orden": 2,
    "activo": true
  },
  {
    "id": 3,
    "nombre": "Ropa y calzado",
    "color_principal": "#7c3aed",
    "color_encabezado": "#1e1b4b",
    "titulo_portada": "Viste a tu estilo",
    "texto_portada": "Ropa y calzado para toda la familia. Elige tus favoritos y pídelos por WhatsApp.",
    "texto_buscador": "Busca camisas, jeans, tenis…",
    "categorias": "Damas\nCaballeros\nNiños\nCalzado\nAccesorios",
    "orden": 3,
    "activo": true
  },
  {
    "id": 4,
    "nombre": "Perfumería y belleza",
    "color_principal": "#db2777",
    "color_encabezado": "#4a044e",
    "titulo_portada": "Belleza que se nota",
    "texto_portada": "Maquillaje, cuidado de la piel, cabello y perfumes. Pide por WhatsApp y te lo apartamos.",
    "texto_buscador": "Busca tu labial, crema o shampoo…",
    "categorias": "Maquillaje\nCuidado facial\nCabello\nUñas\nPerfumes\nAccesorios",
    "orden": 4,
    "activo": true
  },
  {
    "id": 5,
    "nombre": "Farmacia",
    "color_principal": "#0891b2",
    "color_encabezado": "#083344",
    "titulo_portada": "Tu salud, a un mensaje",
    "texto_portada": "Medicamentos de venta libre, vitaminas y cuidado personal. Consulta disponibilidad por WhatsApp.",
    "texto_buscador": "Busca acetaminofén, vitaminas…",
    "categorias": "Medicamentos\nVitaminas\nCuidado personal\nBebés\nPrimeros auxilios",
    "orden": 5,
    "activo": true
  },
  {
    "id": 6,
    "nombre": "Librería y papelería",
    "color_principal": "#2563eb",
    "color_encabezado": "#172554",
    "titulo_portada": "Todo para estudiar y trabajar",
    "texto_portada": "Útiles escolares, papelería y artículos de oficina. Arma tu lista y envíala por WhatsApp.",
    "texto_buscador": "Busca cuadernos, lápices, colores…",
    "categorias": "Útiles escolares\nCuadernos\nArte y manualidades\nOficina\nMochilas",
    "orden": 6,
    "activo": true
  },
  {
    "id": 7,
    "nombre": "Repuestos moto y carro",
    "color_principal": "#dc2626",
    "color_encabezado": "#1c1917",
    "titulo_portada": "El repuesto que buscas",
    "texto_portada": "Repuestos y accesorios para moto y carro. Cotiza por WhatsApp con el modelo de tu vehículo.",
    "texto_buscador": "Busca bujía, filtro, llanta…",
    "categorias": "Motor\nFrenos\nLlantas\nAceites y lubricantes\nEléctrico\nAccesorios",
    "orden": 7,
    "activo": true
  },
  {
    "id": 8,
    "nombre": "Celulares y accesorios",
    "color_principal": "#4f46e5",
    "color_encabezado": "#0f172a",
    "titulo_portada": "Conectado siempre",
    "texto_portada": "Celulares, cargadores, audífonos y accesorios. Pregunta precio y disponibilidad por WhatsApp.",
    "texto_buscador": "Busca cargador, funda, audífonos…",
    "categorias": "Celulares\nCargadores y cables\nAudio\nFundas y protectores\nAccesorios",
    "orden": 8,
    "activo": true
  },
  {
    "id": 9,
    "nombre": "Agroveterinaria",
    "color_principal": "#65a30d",
    "color_encabezado": "#1a2e05",
    "titulo_portada": "Todo para tu campo y tus animales",
    "texto_portada": "Alimentos, medicinas veterinarias, semillas y herramientas de campo. Pide por WhatsApp.",
    "texto_buscador": "Busca concentrado, vacuna, semilla…",
    "categorias": "Alimento para animales\nMedicina veterinaria\nSemillas\nFertilizantes\nHerramientas de campo",
    "orden": 9,
    "activo": true
  },
  {
    "id": 10,
    "nombre": "Mueblería y electrodomésticos",
    "color_principal": "#b45309",
    "color_encabezado": "#292524",
    "titulo_portada": "Equipa tu hogar",
    "texto_portada": "Muebles y electrodomésticos para cada espacio. Cotiza por WhatsApp y pregunta por facilidades.",
    "texto_buscador": "Busca refrigeradora, sala, cama…",
    "categorias": "Salas\nComedores\nDormitorios\nLínea blanca\nElectrónica\nCocina",
    "orden": 10,
    "activo": true
  },
  {
    "id": 11,
    "nombre": "Otro",
    "color_principal": "#0d9488",
    "color_encabezado": "#134e4a",
    "titulo_portada": "Bienvenido a nuestra tienda",
    "texto_portada": "Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.",
    "texto_buscador": "Buscar producto…",
    "categorias": "",
    "orden": 99,
    "activo": true
  }
];
