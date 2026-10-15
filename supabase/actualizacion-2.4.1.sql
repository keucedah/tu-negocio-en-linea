-- Tu Negocio en Línea HN — versión 2.4.1: imagen opcional para celular en cada banner (2:1).
-- Ejecútalo una vez en Supabase > SQL Editor del proyecto tu-negocio-en-linea, ANTES de subir el sitio 2.4.1.
-- Necesita la 2.4 ya ejecutada. Se puede ejecutar más de una vez sin problema. La App Android no cambia.

-- Imagen para celular de cada banner, en el mismo orden que banners_url ('' = ese banner no tiene versión para celular)
alter table public.tiendas add column if not exists banners_movil_url text[] not null default '{}';
alter table public.tiendas add column if not exists banners_movil_path text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tiendas_banners_movil_max') then
    alter table public.tiendas add constraint tiendas_banners_movil_max
      check (cardinality(banners_movil_url) <= 3 and cardinality(banners_movil_path) <= 3);
  end if;
end $$;

-- El dueño de la tienda puede cambiarlas desde su panel
grant update (banners_movil_url, banners_movil_path) on public.tiendas to authenticated;
