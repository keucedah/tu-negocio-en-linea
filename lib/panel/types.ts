export type ColorPlan = "azul" | "naranja" | "verde" | "morado" | "gris";

export type Plan = {
  id: number;
  nombre: string;
  subtitulo: string;
  precio_mensual: number;
  limite_productos: number;
  caracteristicas: string;
  color: ColorPlan;
  orden: number;
  visible: boolean;
};

export type Ajustes = {
  nombre_negocio: string;
  eslogan: string;
  codigo_pais: string;
  celular: string;
  correo: string;
  direccion: string;
  precio_instalacion: number;
  precio_dominio: number;
  dias_aviso: number;
  plantilla_cobro: string;
  plantilla_vencido: string;
  plantilla_recibo: string;
};

export type EstadoCliente = "prueba" | "activo" | "suspendido" | "cancelado";

export type Cliente = {
  id: number;
  negocio: string;
  contacto: string;
  codigo_pais: string;
  celular: string;
  correo: string;
  direccion: string;
  sitio_url: string;
  dominio: string;
  plan_id: number | null;
  con_dominio: boolean;
  limite_personalizado: number | null;
  cuota_personalizada: number | null;
  estado: EstadoCliente;
  fecha_inicio: string;
  proximo_pago: string | null;
  instalacion_pagada: boolean;
  notas: string;
  tipo_negocio_id: number | null;
  tipo_negocio_otro: string;
  tienda_id: number | null;
  creado_en: string;
};

/** Tienda en línea de un cliente, como se ve en su ficha. */
export type TiendaCliente = {
  id: number;
  slug: string;
  nombre_tienda: string;
  dominio: string | null;
  activa: boolean;
  limite_productos: number;
  nombre_plan: string;
  productos: number;
  duenos: string[];
  enlace: string;
};

export type ConceptoPago = "mensualidad" | "instalacion" | "dominio" | "otro";

export type Pago = {
  id: number;
  cliente_id: number;
  fecha: string;
  monto: number;
  concepto: ConceptoPago;
  meses: number;
  metodo: string;
  nota: string;
};

export type Solicitud = {
  id: number;
  nombre: string;
  negocio: string;
  celular: string;
  mensaje: string;
  atendida: boolean;
  creado_en: string;
};

/** Tipo de negocio con su diseño sugerido (colores, textos y categorías iniciales). */
export type TipoNegocio = {
  id: number;
  nombre: string;
  color_principal: string;
  color_encabezado: string;
  titulo_portada: string;
  texto_portada: string;
  texto_buscador: string;
  /** Una categoría por línea. */
  categorias: string;
  orden: number;
  activo: boolean;
};
