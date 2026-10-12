export type Categoria = {
  id: number;
  nombre: string;
};

export type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number | null;
  imagen_url: string | null;
  imagen_path?: string | null;
  /** Foto pequeña (400 px) para la lista; null en fotos subidas antes de la versión 2.1. */
  imagen_mini_url?: string | null;
  destacado?: boolean;
  orden_destacado?: number;
  creado_en: string;
  /** Precio en lempiras; null = el dueño no quiso mostrar precio. */
  precio?: number | null;
  /** Tallas para elegir (calzado, ropa…). Vacía o ausente = sin tallas. */
  tallas?: string[];
  /** Subido en los últimos días: la lista le pone la etiqueta "Nuevo". */
  nuevo?: boolean;
};

/** Textos y colores sugeridos de un tipo de negocio. */
export type TipoNegocio = {
  id: number;
  nombre: string;
  color_principal: string;
  color_encabezado: string;
  titulo_portada: string;
  texto_portada: string;
  texto_buscador: string;
  categorias: string;
  orden: number;
  activo: boolean;
};

/** Fila de la tabla "tiendas". */
export type FilaTienda = {
  id: number;
  slug: string;
  nombre_tienda: string;
  logo_url: string | null;
  logo_path: string | null;
  codigo_pais: string;
  celular: string;
  activa: boolean;
  tipo_negocio_id: number | null;
  tipo_negocio_otro: string;
  color_principal: string;
  color_encabezado: string;
  titulo_portada: string;
  texto_portada: string;
  texto_buscador: string;
  banner_url: string | null;
  banner_path: string | null;
  /** Hasta 3 banners en orden (2.4). Pueden faltar si no se ejecutó el SQL de la 2.4. */
  banners_url?: string[];
  banners_path?: string[];
  /** Imagen para celular (2:1) de cada banner, en el mismo orden; '' = sin versión para celular (2.4.1). */
  banners_movil_url?: string[];
  banners_movil_path?: string[];
  /** Fondo del título de la portada (2.4). Vacío = el de la barra. */
  color_portada?: string;
  tipo: Pick<TipoNegocio, "nombre" | "titulo_portada" | "texto_portada" | "texto_buscador"> | null;
};

export type BannerTienda = { pc: string; movil: string };

/** Datos de la tienda ya listos para mostrar. */
export type Tienda = {
  id: number;
  slug: string;
  activa: boolean;
  nombre: string;
  logoUrl: string | null;
  celularFormateado: string;
  whatsapp: string;
  colorPrincipal: string;
  colorEncabezado: string;
  tituloPortada: string;
  textoPortada: string;
  textoBuscador: string;
  bannerUrl: string | null;
  /** Banners del carrusel de la portada (hasta 3): imagen de computadora (4:1) y, si tiene, la de celular (2:1). */
  banners: BannerTienda[];
  colorPortada: string;
};
