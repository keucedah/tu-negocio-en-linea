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
  destacado?: boolean;
  orden_destacado?: number;
  creado_en: string;
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
  tipo: Pick<TipoNegocio, "nombre" | "titulo_portada" | "texto_portada" | "texto_buscador"> | null;
};

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
};
