-- Tu Negocio en Línea HN — versión 2.3: recibos en PDF numerados y anuncios (sorteos, regalías, promociones).
-- Ejecútalo una vez en Supabase > SQL Editor, ANTES de subir el sitio 2.3.
-- Se puede ejecutar más de una vez sin problema. La App Android no cambia.

-- ===========================================================================
-- 1) Recibos: cada cliente tiene su serie de 4 letras y su propia numeración
--    Ferretería El Sol → FESO-0001, FESO-0002…   Panadería La Espiga → PLES-0001…
-- ===========================================================================

-- Serie de 4 caracteres: primera letra de cada palabra del negocio; si faltan, se completan
-- con las letras siguientes de la última palabra. Si ya la tiene otro cliente, termina en número.
create or replace function public.serie_recibo_para(p_negocio text, p_cliente bigint)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  limpio text := upper(translate(coalesce(p_negocio, ''), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'));
  palabras text[];
  base text := '';
  ultima text;
  candidato text;
  n int := 2;
begin
  palabras := array_remove(regexp_split_to_array(limpio, '[^A-Z0-9]+'), '');
  if coalesce(array_length(palabras, 1), 0) = 0 then palabras := array['CLIENTE']; end if;
  for i in 1 .. least(array_length(palabras, 1), 4) loop
    base := base || left(palabras[i], 1);
  end loop;
  ultima := palabras[least(array_length(palabras, 1), 4)];
  if length(base) < 4 then base := base || substr(ultima, 2, 4 - length(base)); end if;
  base := rpad(base, 4, 'X');
  candidato := base;
  while exists (select 1 from public.clientes c where c.serie_recibo = candidato and c.id <> coalesce(p_cliente, 0)) loop
    candidato := left(base, 4 - length(n::text)) || n;
    n := n + 1;
  end loop;
  return candidato;
end $$;

alter table public.clientes add column if not exists serie_recibo text;
alter table public.clientes add column if not exists ultimo_recibo integer not null default 0;

-- Plan y "pagado hasta" se guardan al registrar el pago: así un recibo viejo no cambia
-- aunque después el cliente cambie de plan o pague más meses.
alter table public.pagos add column if not exists plan_nombre text not null default '';
alter table public.pagos add column if not exists pagado_hasta date;
alter table public.pagos add column if not exists serie_recibo text;
alter table public.pagos add column if not exists numero_recibo integer;

-- Clientes que ya existen: se les asigna su serie (en orden de creación)
do $$
declare r record;
begin
  for r in select id, negocio from public.clientes where serie_recibo is null order by id loop
    update public.clientes set serie_recibo = public.serie_recibo_para(r.negocio, r.id) where id = r.id;
  end loop;
end $$;

-- Pagos que ya existen: se numeran por cliente, del más viejo al más nuevo
do $$
begin
  if exists (select 1 from public.pagos where numero_recibo is null) then
    update public.pagos p set numero_recibo = x.n, serie_recibo = c.serie_recibo
      from (select id, row_number() over (partition by cliente_id order by fecha, creado_en, id) as n from public.pagos) x,
           public.clientes c
     where x.id = p.id and c.id = p.cliente_id;
    update public.clientes c set ultimo_recibo = coalesce((select max(numero_recibo) from public.pagos p where p.cliente_id = c.id), 0);
    -- Plan actual del cliente para los recibos de pagos anteriores
    update public.pagos p set plan_nombre = coalesce(pl.nombre, '')
      from public.clientes c left join public.planes pl on pl.id = c.plan_id
     where c.id = p.cliente_id and p.plan_nombre = '';
  end if;
end $$;

alter table public.clientes alter column serie_recibo set not null;
alter table public.pagos alter column numero_recibo set not null;
alter table public.pagos alter column serie_recibo set not null;
create unique index if not exists clientes_serie_recibo_key on public.clientes (serie_recibo);
create unique index if not exists pagos_recibo_key on public.pagos (cliente_id, numero_recibo);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pagos_plan_nombre_check') then
    alter table public.pagos add constraint pagos_plan_nombre_check check (char_length(plan_nombre) <= 40);
  end if;
end $$;

-- Cliente nuevo: recibe su serie al crearlo (no cambia si después se le cambia el nombre)
create or replace function public.asignar_serie_cliente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.serie_recibo is null then
    new.serie_recibo := public.serie_recibo_para(new.negocio, new.id);
  end if;
  return new;
end $$;
drop trigger if exists clientes_serie_recibo on public.clientes;
create trigger clientes_serie_recibo before insert on public.clientes
  for each row execute function public.asignar_serie_cliente();

-- Pago nuevo: toma el siguiente número del cliente. Un número usado nunca se repite,
-- aunque se borre el pago.
create or replace function public.numerar_recibo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.clientes
     set ultimo_recibo = ultimo_recibo + 1
   where id = new.cliente_id
  returning ultimo_recibo, serie_recibo into new.numero_recibo, new.serie_recibo;
  return new;
end $$;
drop trigger if exists pagos_numero_recibo on public.pagos;
create trigger pagos_numero_recibo before insert on public.pagos
  for each row execute function public.numerar_recibo();

revoke execute on function public.asignar_serie_cliente() from public, anon, authenticated;
revoke execute on function public.numerar_recibo() from public, anon, authenticated;

-- ===========================================================================
-- 2) Anuncios: los creas en tu panel y salen en un carrusel solo en las tiendas de tus clientes
-- ===========================================================================
create table if not exists public.anuncios (
  id bigint generated always as identity primary key,
  titulo text not null check (char_length(titulo) between 1 and 80),
  texto text not null default '' check (char_length(texto) <= 1000),
  -- Hasta 4 imágenes (dirección pública y ruta en Storage, en el mismo orden) O un video por enlace
  imagenes text[] not null default '{}' check (cardinality(imagenes) <= 4),
  rutas_imagenes text[] not null default '{}' check (cardinality(rutas_imagenes) <= 4),
  video_url text not null default '' check (char_length(video_url) <= 300 and (video_url = '' or video_url ~* '^https://')),
  -- Botón opcional, por ejemplo "Participar" con tu WhatsApp
  boton_texto text not null default 'Quiero participar' check (char_length(boton_texto) <= 30),
  boton_url text not null default '' check (char_length(boton_url) <= 300 and (boton_url = '' or boton_url ~* '^https://')),
  -- Dónde sale: en todas las tiendas de tus clientes (lista vacía) o solo en las elegidas,
  -- y si también sale en tu página principal
  tiendas bigint[] not null default '{}',
  en_inicio boolean not null default true,
  activo boolean not null default true,
  inicia date,
  termina date,
  orden smallint not null default 0,
  creado_en timestamptz not null default now(),
  constraint anuncios_imagen_o_video check (not (cardinality(imagenes) > 0 and video_url <> '')),
  constraint anuncios_fechas check (inicia is null or termina is null or termina >= inicia)
);
create index if not exists anuncios_activo_idx on public.anuncios (activo, orden);
-- Por si se ejecutó una versión anterior de este archivo
alter table public.anuncios add column if not exists en_inicio boolean not null default true;

alter table public.anuncios enable row level security;

-- El público solo ve los anuncios activos y dentro de sus fechas (hora de Honduras)
drop policy if exists "anuncios publicos vigentes" on public.anuncios;
create policy "anuncios publicos vigentes" on public.anuncios
  for select to anon, authenticated
  using (
    activo
    and (inicia is null or inicia <= (now() at time zone 'America/Tegucigalpa')::date)
    and (termina is null or termina >= (now() at time zone 'America/Tegucigalpa')::date)
  );

-- Tú (administrador de la plataforma) los ves y manejas todos
drop policy if exists "admin panel anuncios" on public.anuncios;
create policy "admin panel anuncios" on public.anuncios
  for all to authenticated
  using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- Imágenes de los anuncios en la carpeta "anuncios/" del mismo almacenamiento de imágenes
drop policy if exists "admin sube anuncios" on storage.objects;
create policy "admin sube anuncios" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'anuncios' and (select public.es_admin_panel()));
drop policy if exists "admin actualiza anuncios" on storage.objects;
create policy "admin actualiza anuncios" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'anuncios' and (select public.es_admin_panel()));
drop policy if exists "admin borra anuncios" on storage.objects;
create policy "admin borra anuncios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'anuncios' and (select public.es_admin_panel()));
drop policy if exists "admin ve anuncios" on storage.objects;
create policy "admin ve anuncios" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'anuncios' and (select public.es_admin_panel()));
