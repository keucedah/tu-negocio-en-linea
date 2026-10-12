-- Tu Negocio en Línea HN — versión 2.4: hasta 3 banners por tienda (carrusel en la portada)
-- y color de fondo para el título y el texto de la portada.
-- Ejecútalo una vez en Supabase > SQL Editor del proyecto tu-negocio-en-linea, ANTES de subir el sitio 2.4.
-- Se puede ejecutar más de una vez sin problema. La App Android no cambia: sigue usando el primer banner.

-- Todos los banners de la tienda, en orden (dirección pública y ruta en Storage).
-- banner_url y banner_path siguen guardando el primero, que es el que usa la App.
alter table public.tiendas add column if not exists banners_url text[] not null default '{}';
alter table public.tiendas add column if not exists banners_path text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tiendas_banners_max') then
    alter table public.tiendas add constraint tiendas_banners_max
      check (cardinality(banners_url) <= 3 and cardinality(banners_path) <= 3);
  end if;
end $$;

-- Tiendas que ya tienen banner: ese pasa a ser el primero del carrusel
update public.tiendas
   set banners_url = array[banner_url], banners_path = array[coalesce(banner_path, '')]
 where banner_url is not null and cardinality(banners_url) = 0;

-- Color del fondo del título y el texto de la portada (vacío = el mismo de la barra de arriba)
alter table public.tiendas add column if not exists color_portada text not null default '';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tiendas_color_portada_check') then
    alter table public.tiendas add constraint tiendas_color_portada_check
      check (color_portada = '' or color_portada ~ '^#[0-9a-f]{6}$');
  end if;
end $$;

-- El dueño de la tienda puede cambiar sus banners y ese color desde su panel
grant update (banners_url, banners_path, color_portada) on public.tiendas to authenticated;
