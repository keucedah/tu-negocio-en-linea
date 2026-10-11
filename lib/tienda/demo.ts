import type { Categoria, Producto } from "./types";

// Datos de ejemplo que se muestran mientras no haya Supabase configurado.
export const categoriasDemo: Categoria[] = [
  { id: 1, nombre: "Herramientas manuales" },
  { id: 2, nombre: "Herramientas eléctricas" },
  { id: 3, nombre: "Tornillería y fijaciones" },
  { id: 4, nombre: "Pinturas" },
  { id: 5, nombre: "Electricidad" },
];

const d = (n: number) => new Date(Date.UTC(2026, 9, n)).toISOString();

export const productosDemo: Producto[] = [
  { id: 1, nombre: "Martillo de uña 16 oz", descripcion: "Mango de fibra de vidrio antivibración, cabeza de acero forjado.", categoria_id: 1, imagen_url: null, destacado: true, orden_destacado: 3, precio: 185, creado_en: d(1) },
  { id: 2, nombre: "Juego de destornilladores 6 piezas", descripcion: "Puntas planas y Phillips con punta imantada y mango ergonómico.", categoria_id: 1, imagen_url: null, creado_en: d(2) },
  { id: 3, nombre: "Taladro percutor 650 W", descripcion: "Velocidad variable, reversa y mandril de 13 mm. Incluye maletín.", categoria_id: 2, imagen_url: null, destacado: true, orden_destacado: 0, precio: 1650, creado_en: d(3) },
  { id: 4, nombre: "Esmeril angular 4 1/2\"", descripcion: "Motor de 850 W, protector ajustable y mango lateral.", categoria_id: 2, imagen_url: null, creado_en: d(4) },
  { id: 5, nombre: "Caja de tornillos para madera 1\" (100 u)", descripcion: "Cabeza plana Phillips, acero zincado.", categoria_id: 3, imagen_url: null, precio: 95, creado_en: d(5) },
  { id: 6, nombre: "Tarugos plásticos 8 mm (50 u)", descripcion: "Para muros de concreto y ladrillo.", categoria_id: 3, imagen_url: null, creado_en: d(6) },
  { id: 7, nombre: "Pintura látex blanca 1 galón", descripcion: "Uso interior, acabado mate, alto rendimiento.", categoria_id: 4, imagen_url: null, destacado: true, orden_destacado: 1, creado_en: d(7) },
  { id: 8, nombre: "Rodillo antigota 9\"", descripcion: "Felpa de 3/8\" para superficies lisas.", categoria_id: 4, imagen_url: null, creado_en: d(8) },
  { id: 9, nombre: "Cable THHN 12 AWG (rollo 100 m)", descripcion: "Conductor de cobre, aislamiento de PVC, color rojo.", categoria_id: 5, imagen_url: null, destacado: true, orden_destacado: 2, creado_en: d(9) },
  { id: 10, nombre: "Interruptor sencillo", descripcion: "Placa blanca, 15 A, 127 V.", categoria_id: 5, imagen_url: null, creado_en: d(10) },
];
