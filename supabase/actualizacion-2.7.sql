-- =====================================================================
-- Tu Negocio en Línea HN · Actualización 2.7
-- Tallas o medidas según el tipo de negocio.
-- Cada tipo de negocio tiene su palabra (talla, medida, presentación, opción…)
-- y sus grupos para marcar con un toque (Pulgadas, Milímetros, Calzado…).
-- Una ferretería ya no ve "Calzado" ni "Bebé": ve "Tiene medidas" con Pulgadas, etc.
--
-- Ejecútalo en el SQL Editor del proyecto "tu-negocio-en-linea", DESPUÉS de
-- actualizacion-2.6.sql. Se puede ejecutar más de una vez sin dañar nada:
-- solo llena los tipos que todavía no tienen palabra ni grupos, así que no
-- borra lo que cambies después en Admin › Tipos de negocio.
-- Las tallas o medidas que ya tienen los productos no cambian.
-- =====================================================================

-- Palabra en singular y en minúscula: talla, medida, presentación, opción…
alter table public.tipos_negocio add column if not exists medida_palabra text not null default '';
-- Un grupo por línea: "Pulgadas: 1/4\", 1/2\", 3/4\""
alter table public.tipos_negocio add column if not exists medida_grupos text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tipos_negocio_medida_palabra_check') then
    alter table public.tipos_negocio add constraint tipos_negocio_medida_palabra_check check (char_length(medida_palabra) <= 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'tipos_negocio_medida_grupos_check') then
    alter table public.tipos_negocio add constraint tipos_negocio_medida_grupos_check check (char_length(medida_grupos) <= 2000);
  end if;
end $$;

-- Valores iniciales por el nombre del tipo (el primero que coincide gana).
-- Solo en los tipos que todavía están vacíos.
with sugeridos (prioridad, patron, palabra, grupos) as (values
  (1, '%ferreter%', 'medida', E'Pulgadas: 1/8", 1/4", 3/8", 1/2", 5/8", 3/4", 1", 1 1/4", 1 1/2", 2", 3", 4"\nMilímetros: 3 mm, 4 mm, 5 mm, 6 mm, 8 mm, 10 mm, 12 mm, 16 mm, 20 mm, 25 mm\nCable (calibre): 18 AWG, 16 AWG, 14 AWG, 12 AWG, 10 AWG, 8 AWG, 6 AWG\nPintura: 1/8 galón, 1/4 galón, 1 galón, Cubeta 5 galones\nLargo: 1 m, 3 m, 5 m, 6 m, 10 m, 25 m, 50 m'),
  (2, '%ropa%', 'talla', E'Ropa: XS, S, M, L, XL, XXL, XXXL\nCalzado: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45\nPantalón (cintura): 28, 30, 32, 34, 36, 38, 40, 42\nNiños: 2, 4, 6, 8, 10, 12, 14, 16\nBebé: 0-3 m, 3-6 m, 6-9 m, 9-12 m, 12-18 m, 18-24 m'),
  (3, '%calzado%', 'talla', E'Calzado: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45\nNiños: 18, 20, 22, 24, 26, 28, 30, 32'),
  (3, '%zapat%', 'talla', E'Calzado: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45\nNiños: 18, 20, 22, 24, 26, 28, 30, 32'),
  (2, '%boutique%', 'talla', E'Ropa: XS, S, M, L, XL, XXL, XXXL\nPantalón (cintura): 28, 30, 32, 34, 36, 38, 40, 42\nCalzado: 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45'),
  (3, '%farmac%', 'presentación', E'Miligramos: 5 mg, 10 mg, 25 mg, 50 mg, 100 mg, 250 mg, 500 mg, 1 g\nMililitros: 5 ml, 10 ml, 30 ml, 60 ml, 120 ml, 240 ml, 500 ml\nCantidad: 1 u, 10 u, 20 u, 30 u, 50 u, 100 u'),
  (3, '%perfum%', 'presentación', E'Mililitros: 30 ml, 50 ml, 60 ml, 100 ml, 125 ml, 200 ml, 250 ml'),
  (3, '%belleza%', 'presentación', E'Mililitros: 30 ml, 50 ml, 60 ml, 100 ml, 125 ml, 200 ml, 250 ml'),
  (3, '%abarrot%', 'presentación', E'Peso: 1/2 lb, 1 lb, 2 lb, 5 lb, 10 lb, 25 lb, 50 lb, 1 quintal\nVolumen: 250 ml, 500 ml, 1 litro, 2 litros, 3 litros, 1 galón'),
  (3, '%pulper%', 'presentación', E'Peso: 1/2 lb, 1 lb, 2 lb, 5 lb, 10 lb, 25 lb, 50 lb, 1 quintal\nVolumen: 250 ml, 500 ml, 1 litro, 2 litros, 3 litros, 1 galón'),
  (3, '%agro%', 'presentación', E'Peso: 1 lb, 5 lb, 10 lb, 25 lb, 50 lb, 100 lb\nVolumen: 100 ml, 250 ml, 500 ml, 1 litro, 1 galón'),
  (3, '%veterin%', 'presentación', E'Peso: 1 lb, 5 lb, 10 lb, 25 lb, 50 lb, 100 lb\nVolumen: 100 ml, 250 ml, 500 ml, 1 litro, 1 galón'),
  (4, '%repuesto%', 'medida', E'Llanta: 2.50-17, 2.75-17, 2.75-18, 3.00-17, 3.00-18, 80/90-17, 90/90-18\nAceite: 1/4 galón, 1 litro, 1 galón'),
  (4, '%celular%', 'opción', E'Color: Negro, Blanco, Azul, Rojo, Verde, Rosado, Dorado\nCapacidad: 32 GB, 64 GB, 128 GB, 256 GB, 512 GB'),
  (4, '%librer%', 'opción', E'Tamaño: Carta, Oficio, A4, Media carta\nColor: Negro, Azul, Rojo, Verde\nHojas: 50 hojas, 100 hojas, 200 hojas'),
  (4, '%papeler%', 'opción', E'Tamaño: Carta, Oficio, A4, Media carta\nColor: Negro, Azul, Rojo, Verde\nHojas: 50 hojas, 100 hojas, 200 hojas'),
  (4, '%muebl%', 'opción', E'Color: Negro, Blanco, Café, Gris, Madera\nTamaño de cama: Individual, Matrimonial, Queen, King'),
  (5, '%electrodom%', 'opción', E'Color: Negro, Blanco, Gris, Acero\nCapacidad: 7 pies, 10 pies, 14 pies, 18 pies')
),
elegido as (
  select distinct on (t.id) t.id, s.palabra, s.grupos
  from public.tipos_negocio t
  join sugeridos s on lower(t.nombre) like s.patron
  order by t.id, s.prioridad
)
update public.tipos_negocio t
   set medida_palabra = e.palabra, medida_grupos = e.grupos
  from elegido e
 where t.id = e.id and t.medida_palabra = '' and t.medida_grupos = '';

-- Los demás tipos (Panadería, Otro…) quedan con "opción" y sin grupos:
-- el dueño escribe lo que necesite en "Otra opción".
update public.tipos_negocio set medida_palabra = 'opción' where medida_palabra = '';

-- Que la API vea las columnas nuevas al momento
notify pgrst, 'reload schema';
