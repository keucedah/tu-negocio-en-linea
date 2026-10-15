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
  /** Las tiendas con este plan muestran publicidad de otras tiendas (2.5). */
  con_publicidad: boolean;
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
  /** Mensualidad de cada mototaxista (2.5). */
  cuota_mototaxi: number;
  /** Precio por cada 50 productos adicionales que se cargan en la instalación (2.5). */
  precio_carga_extra: number;
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
  /** Municipio de su tienda (2.5): ahí salen sus mototaxistas. */
  municipio_id: number | null;
  /** "Servicio de mototaxi" en su tienda: solo el administrador lo cambia (2.5.1). */
  ofrece_mototaxi: boolean;
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
  /** Serie del cliente (4 letras) y número de su recibo: FESO-0001. Nunca se repite. */
  serie_recibo: string;
  numero_recibo: number;
  /** Plan del cliente cuando pagó, para que el recibo no cambie después. */
  plan_nombre: string;
  /** Hasta qué fecha queda pagado (solo mensualidades). */
  pagado_hasta: string | null;
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

/** Anuncio (sorteo, regalía, promoción) que sale en un carrusel en las tiendas de los clientes. */
export type Anuncio = {
  id: number;
  titulo: string;
  texto: string;
  /** Hasta 4 imágenes WebP (direcciones públicas). */
  imagenes: string[];
  rutas_imagenes: string[];
  /** O un video por enlace (YouTube, Facebook, TikTok…). */
  video_url: string;
  boton_texto: string;
  boton_url: string;
  /** Tiendas donde sale. Vacío = en todas. */
  tiendas: number[];
  /** También sale en la página principal de la plataforma. */
  en_inicio: boolean;
  activo: boolean;
  inicia: string | null;
  termina: string | null;
  orden: number;
  creado_en: string;
};

export type Departamento = { id: number; nombre: string };
export type Municipio = { id: number; departamento_id: number; nombre: string };
export type Ubicaciones = { departamentos: Departamento[]; municipios: Municipio[] };

/** Mototaxista registrado por el administrador (2.5). La identidad nunca sale en las tiendas. */
export type Mototaxista = {
  id: number;
  codigo: string;
  nombre: string;
  codigo_pais: string;
  celular: string;
  identidad: string;
  direccion: string;
  numero_mototaxi: string;
  foto_url: string | null;
  foto_path: string | null;
  foto_moto_url: string | null;
  foto_moto_path: string | null;
  municipio_id: number | null;
  municipios_extra: number[];
  acepto_publicar: boolean;
  acepto_fecha: string | null;
  cuota_personalizada: number | null;
  /** Hasta qué día está pagado. Vencido (o sin pagos) = suspendido en las tiendas. */
  pagado_hasta: string | null;
  /** false = dado de baja: no sale en ningún lado. */
  activo: boolean;
  notas: string;
  token: string;
  veces_elegido: number;
  creado_en: string;
};

export type PagoMototaxi = {
  id: number;
  mototaxista_id: number;
  fecha: string;
  monto: number;
  meses: number;
  metodo: string;
  nota: string;
  pagado_hasta: string;
  numero_recibo: number;
};

/** Publicidad pagada de una tienda (u otro negocio) en tiendas de otro tipo de negocio (2.5). */
export type Publicidad = {
  id: number;
  anunciante_tienda_id: number | null;
  anunciante_nombre: string;
  tipo_negocio_id: number | null;
  tipo_negocio_otro: string;
  titulo: string;
  texto: string;
  imagen_url: string;
  imagen_path: string;
  enlace_url: string;
  boton_texto: string;
  municipio_id: number | null;
  precio: number | null;
  activo: boolean;
  inicia: string | null;
  termina: string | null;
  vistas: number;
  clics: number;
  creado_en: string;
};
