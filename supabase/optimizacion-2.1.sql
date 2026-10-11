-- Optimización de la base de datos (Tu Negocio en Línea HN).
-- Se puede correr varias veces sin problema. Supabase > SQL Editor > pegar todo > Run.

-- 1) Índice que ya trae los productos en el orden del catálogo (más nuevos primero),
--    así la base no tiene que ordenarlos en cada visita.
create index if not exists productos_tienda_orden_idx on public.productos (tienda_id, creado_en desc, id desc);
drop index if exists public.productos_tienda_creado_idx;

-- 2) Índice para borrar o cambiar categorías sin revisar todos los productos.
create index if not exists productos_categoria_idx on public.productos (categoria_id);

-- 3) Regla de lectura pública más liviana: en vez de armar la lista de TODAS las tiendas
--    visibles en cada consulta, solo revisa la tienda que se está pidiendo.
drop policy if exists "catalogo publico productos" on public.productos;
create policy "catalogo publico productos" on public.productos for select
  using (
    exists (select 1 from public.tiendas t where t.id = productos.tienda_id and t.activa)
    or tienda_id in (select public.tiendas_administradas())
  );

drop policy if exists "catalogo publico categorias" on public.categorias;
create policy "catalogo publico categorias" on public.categorias for select
  using (
    exists (select 1 from public.tiendas t where t.id = categorias.tienda_id and t.activa)
    or tienda_id in (select public.tiendas_administradas())
  );

analyze public.productos;
analyze public.categorias;

-- 4) Búsqueda en la base de datos (para tiendas con miles de productos).
--    nombre_busqueda = el nombre en minúsculas y sin tildes; se llena solo.
alter table public.productos add column if not exists nombre_busqueda text not null default '';

create or replace function public.texto_busqueda(t text) returns text
language sql immutable as $$
  select translate(lower(t), 'áéíóúüñàèìòùâêîôûäëïöç', 'aeiouunaeiouaeiouaeioc')
$$;

create or replace function public.productos_nombre_busqueda() returns trigger
language plpgsql as $$
begin
  new.nombre_busqueda := public.texto_busqueda(new.nombre);
  return new;
end $$;

drop trigger if exists productos_nombre_busqueda on public.productos;
create trigger productos_nombre_busqueda before insert or update of nombre on public.productos
  for each row execute function public.productos_nombre_busqueda();

update public.productos set nombre_busqueda = public.texto_busqueda(nombre)
  where nombre_busqueda is distinct from public.texto_busqueda(nombre);

create index if not exists productos_tienda_nombre_idx on public.productos (tienda_id, nombre_busqueda);

-- 5) Cuántos productos hay en cada categoría (los botones de categorías de la tienda).
--    Respeta las mismas reglas de seguridad que la tabla de productos.
create or replace function public.conteo_categorias(t bigint)
returns table (categoria_id bigint, total bigint)
language sql stable as $$
  select p.categoria_id, count(*) from public.productos p where p.tienda_id = t group by p.categoria_id
$$;
grant execute on function public.conteo_categorias(bigint) to anon, authenticated;

analyze public.productos;

-- 6) Texto de portada de Ferretería: "pedido" en vez de "cotización" (solo si no lo cambiaste tú).
update public.tipos_negocio
  set texto_portada = 'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.'
  where texto_portada = 'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu cotización por WhatsApp.';
update public.tiendas
  set texto_portada = 'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.'
  where texto_portada = 'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu cotización por WhatsApp.';

-- 7) Foto pequeña de cada producto (400 px) para la lista del catálogo y la App.
--    Las fotos subidas antes quedan sin pequeña y se sigue usando la grande.
alter table public.productos add column if not exists imagen_mini_url text;
alter table public.productos add column if not exists imagen_mini_path text;
