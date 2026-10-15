-- Tu Negocio en Línea HN — versión 2.5: mototaxistas, municipios y publicidad pagada.
-- Ejecútalo una vez en Supabase (proyecto tu-negocio-en-linea) > SQL Editor, ANTES de subir el sitio 2.5.
-- Se puede ejecutar más de una vez sin problema. La App Android no cambia todavía.

-- ===========================================================================
-- 1) Departamentos y municipios (los municipios los agregas tú desde el panel)
-- ===========================================================================
create or replace function public.texto_busqueda(t text) returns text
language sql immutable as $$
  select translate(lower(t), 'áéíóúüñàèìòùâêîôûäëïöç', 'aeiouunaeiouaeiouaeioc')
$$;

create table if not exists public.departamentos (
  id bigint generated always as identity primary key,
  nombre text not null unique check (char_length(nombre) between 1 and 60)
);

create table if not exists public.municipios (
  id bigint generated always as identity primary key,
  departamento_id bigint not null references public.departamentos (id) on delete restrict,
  nombre text not null check (char_length(nombre) between 1 and 60),
  creado_en timestamptz not null default now()
);
-- Sin repetidos en el mismo departamento, sin importar tildes ni mayúsculas ("Langue" = "langue")
create unique index if not exists municipios_nombre_key
  on public.municipios (departamento_id, public.texto_busqueda(btrim(nombre)));

insert into public.departamentos (nombre) values
  ('Atlántida'), ('Choluteca'), ('Colón'), ('Comayagua'), ('Copán'), ('Cortés'),
  ('El Paraíso'), ('Francisco Morazán'), ('Gracias a Dios'), ('Intibucá'), ('Islas de la Bahía'),
  ('La Paz'), ('Lempira'), ('Ocotepeque'), ('Olancho'), ('Santa Bárbara'), ('Valle'), ('Yoro')
on conflict (nombre) do nothing;

insert into public.municipios (departamento_id, nombre)
select d.id, 'Langue' from public.departamentos d
 where d.nombre = 'Valle'
   and not exists (select 1 from public.municipios m where m.departamento_id = d.id and public.texto_busqueda(btrim(m.nombre)) = 'langue');

alter table public.departamentos enable row level security;
alter table public.municipios enable row level security;
drop policy if exists "departamentos publicos" on public.departamentos;
create policy "departamentos publicos" on public.departamentos for select to anon, authenticated using (true);
drop policy if exists "municipios publicos" on public.municipios;
create policy "municipios publicos" on public.municipios for select to anon, authenticated using (true);
drop policy if exists "admin panel municipios" on public.municipios;
create policy "admin panel municipios" on public.municipios
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- ===========================================================================
-- 2) Clientes y tiendas: municipio, dirección de la tienda y "Ofrecer mototaxi"
-- ===========================================================================
alter table public.clientes add column if not exists municipio_id bigint references public.municipios (id) on delete set null;
alter table public.tiendas add column if not exists municipio_id bigint references public.municipios (id) on delete set null;
alter table public.tiendas add column if not exists direccion text not null default '';
alter table public.tiendas add column if not exists ofrece_mototaxi boolean not null default true;
create index if not exists tiendas_municipio_idx on public.tiendas (municipio_id);
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tiendas_direccion_check') then
    alter table public.tiendas add constraint tiendas_direccion_check check (char_length(direccion) <= 200);
  end if;
end $$;

-- La dirección de cada tienda sale de la ficha de su cliente (se copia al guardar el cliente)
update public.tiendas t set direccion = c.direccion
  from public.clientes c
 where c.tienda_id = t.id and t.direccion = '' and c.direccion <> '';

-- El dueño de la tienda puede prender o apagar "Ofrecer mototaxi" en su panel
grant update (ofrece_mototaxi) on public.tiendas to authenticated;

-- ===========================================================================
-- 3) Datos de tu negocio: mensualidad de los mototaxistas y precio de carga de productos
-- ===========================================================================
alter table public.ajustes_negocio add column if not exists cuota_mototaxi numeric(10, 2) not null default 50;
alter table public.ajustes_negocio add column if not exists precio_carga_extra numeric(10, 2) not null default 150;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ajustes_cuota_mototaxi_check') then
    alter table public.ajustes_negocio add constraint ajustes_cuota_mototaxi_check check (cuota_mototaxi >= 0 and precio_carga_extra >= 0);
  end if;
end $$;

-- ===========================================================================
-- 4) Mototaxistas (solo tú los registras y los ves completos)
-- ===========================================================================
create table if not exists public.mototaxistas (
  id bigint generated always as identity primary key,
  codigo text unique,                                  -- MT-001 (se pone solo)
  nombre text not null check (char_length(nombre) between 1 and 80),
  codigo_pais text not null default '504' check (codigo_pais ~ '^[0-9]{1,4}$'),
  celular text not null check (celular ~ '^[0-9]{6,14}$'),
  identidad text not null default '' check (char_length(identidad) <= 30),   -- privada: nunca sale en las tiendas
  direccion text not null default '' check (char_length(direccion) <= 200),
  numero_mototaxi text not null default '' check (char_length(numero_mototaxi) <= 20),
  foto_url text, foto_path text,
  foto_moto_url text, foto_moto_path text,
  municipio_id bigint references public.municipios (id) on delete set null,
  municipios_extra bigint[] not null default '{}',
  acepto_publicar boolean not null default false,
  acepto_fecha date,
  cuota_personalizada numeric(10, 2) check (cuota_personalizada is null or cuota_personalizada >= 0),
  pagado_hasta date,
  activo boolean not null default true,                -- false = dado de baja (no sale en ningún lado)
  notas text not null default '' check (char_length(notas) <= 1000),
  token uuid not null default gen_random_uuid() unique, -- enlace de su página personal
  veces_elegido integer not null default 0,
  ultimo_recibo integer not null default 0,
  creado_en timestamptz not null default now()
);
create index if not exists mototaxistas_municipio_idx on public.mototaxistas (municipio_id);

create or replace function public.codigo_mototaxista()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.codigo is null then new.codigo := 'MT-' || lpad(new.id::text, 3, '0'); end if;
  return new;
end $$;
drop trigger if exists mototaxistas_codigo on public.mototaxistas;
create trigger mototaxistas_codigo before insert on public.mototaxistas
  for each row execute function public.codigo_mototaxista();

create table if not exists public.pagos_mototaxi (
  id bigint generated always as identity primary key,
  mototaxista_id bigint not null references public.mototaxistas (id) on delete cascade,
  fecha date not null default current_date,
  monto numeric(10, 2) not null check (monto > 0),
  meses smallint not null default 1 check (meses between 1 and 24),
  metodo text not null default '' check (char_length(metodo) <= 40),
  nota text not null default '' check (char_length(nota) <= 300),
  pagado_hasta date not null,
  pagado_antes date,                                   -- para regresar la fecha si se borra el pago
  numero_recibo integer not null,
  creado_en timestamptz not null default now()
);
alter table public.pagos_mototaxi add column if not exists pagado_antes date;
create index if not exists pagos_mototaxi_idx on public.pagos_mototaxi (mototaxista_id, fecha desc);
create unique index if not exists pagos_mototaxi_recibo_key on public.pagos_mototaxi (mototaxista_id, numero_recibo);

-- Pago nuevo: siguiente número de recibo del mototaxista (MT001-0001, MT001-0002…). Nunca se repite.
create or replace function public.numerar_recibo_mototaxi()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.mototaxistas set ultimo_recibo = ultimo_recibo + 1
   where id = new.mototaxista_id
  returning ultimo_recibo into new.numero_recibo;
  return new;
end $$;
revoke execute on function public.numerar_recibo_mototaxi() from public, anon, authenticated;
drop trigger if exists pagos_mototaxi_numero on public.pagos_mototaxi;
create trigger pagos_mototaxi_numero before insert on public.pagos_mototaxi
  for each row execute function public.numerar_recibo_mototaxi();

alter table public.mototaxistas enable row level security;
alter table public.pagos_mototaxi enable row level security;
drop policy if exists "admin panel mototaxistas" on public.mototaxistas;
create policy "admin panel mototaxistas" on public.mototaxistas
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));
drop policy if exists "admin panel pagos mototaxi" on public.pagos_mototaxi;
create policy "admin panel pagos mototaxi" on public.pagos_mototaxi
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- Mototaxistas que ve una tienda: los de su municipio (principal o extra), sin la identidad.
-- Los vencidos llegan con suspendido = true (salen al final, en gris, sin poder elegirse).
create or replace function public.mototaxis_de_tienda(t bigint)
returns table (
  id bigint, codigo text, nombre text, codigo_pais text, celular text, direccion text,
  numero_mototaxi text, foto_url text, foto_moto_url text, suspendido boolean
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.codigo, m.nombre, m.codigo_pais, m.celular, m.direccion,
         m.numero_mototaxi, m.foto_url, m.foto_moto_url,
         (m.pagado_hasta is null or m.pagado_hasta < (now() at time zone 'America/Tegucigalpa')::date)
    from public.tiendas ti
    join public.mototaxistas m
      on m.activo and m.acepto_publicar
     and (m.municipio_id = ti.municipio_id or ti.municipio_id = any (m.municipios_extra))
   where ti.id = t and ti.activa and ti.ofrece_mototaxi and ti.municipio_id is not null
   order by m.id;
$$;
revoke execute on function public.mototaxis_de_tienda(bigint) from public;
grant execute on function public.mototaxis_de_tienda(bigint) to anon, authenticated;

-- Cuenta las veces que un cliente eligió al mototaxista
create or replace function public.contar_mototaxi(p_id bigint)
returns void language sql security definer set search_path = '' as $$
  update public.mototaxistas set veces_elegido = veces_elegido + 1 where id = p_id and activo;
$$;
revoke execute on function public.contar_mototaxi(bigint) from public;
grant execute on function public.contar_mototaxi(bigint) to anon, authenticated;

-- Página personal del mototaxista (enlace privado, sin contraseña)
create or replace function public.mototaxista_por_token(p_token uuid)
returns table (
  codigo text, nombre text, foto_url text, numero_mototaxi text, municipio text,
  pagado_hasta date, activo boolean, acepto_publicar boolean, cuota numeric
)
language sql stable security definer set search_path = '' as $$
  select m.codigo, m.nombre, m.foto_url, m.numero_mototaxi,
         coalesce(mu.nombre || ', ' || d.nombre, ''),
         m.pagado_hasta, m.activo, m.acepto_publicar,
         coalesce(m.cuota_personalizada, (select a.cuota_mototaxi from public.ajustes_negocio a where a.id = 1))
    from public.mototaxistas m
    left join public.municipios mu on mu.id = m.municipio_id
    left join public.departamentos d on d.id = mu.departamento_id
   where m.token = p_token;
$$;
revoke execute on function public.mototaxista_por_token(uuid) from public;
grant execute on function public.mototaxista_por_token(uuid) to anon, authenticated;

-- Fotos de los mototaxistas en la carpeta "mototaxis/" (solo tú las subes)
drop policy if exists "admin sube mototaxis" on storage.objects;
create policy "admin sube mototaxis" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'mototaxis' and (select public.es_admin_panel()));
drop policy if exists "admin actualiza mototaxis" on storage.objects;
create policy "admin actualiza mototaxis" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'mototaxis' and (select public.es_admin_panel()));
drop policy if exists "admin borra mototaxis" on storage.objects;
create policy "admin borra mototaxis" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'mototaxis' and (select public.es_admin_panel()));
drop policy if exists "admin ve mototaxis" on storage.objects;
create policy "admin ve mototaxis" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagenes' and split_part(name, '/', 1) = 'mototaxis' and (select public.es_admin_panel()));

-- ===========================================================================
-- 5) Publicidad pagada: una tienda (u otro negocio) te paga por anunciarse
--    en las tiendas de OTRO tipo de negocio que tienen un plan con publicidad.
-- ===========================================================================
alter table public.planes add column if not exists con_publicidad boolean not null default false;
-- Primera vez: Básico y Pro (no Pro Plus) muestran publicidad. Lo cambias en Planes.
do $$
begin
  if not exists (select 1 from public.planes where con_publicidad) then
    update public.planes set con_publicidad = true
     where public.texto_busqueda(nombre) like 'basico%'
        or (public.texto_busqueda(nombre) like 'pro%' and public.texto_busqueda(nombre) not like 'pro plus%');
  end if;
end $$;

create table if not exists public.publicidad (
  id bigint generated always as identity primary key,
  anunciante_tienda_id bigint references public.tiendas (id) on delete set null,
  anunciante_nombre text not null check (char_length(anunciante_nombre) between 1 and 80),
  -- Tipo de negocio del anunciante: nunca sale en tiendas del mismo tipo
  tipo_negocio_id bigint references public.tipos_negocio (id) on delete set null,
  tipo_negocio_otro text not null default '' check (char_length(tipo_negocio_otro) <= 60),
  titulo text not null check (char_length(titulo) between 1 and 80),
  texto text not null default '' check (char_length(texto) <= 300),
  imagen_url text not null,
  imagen_path text not null default '',
  -- Vacío = la tienda del anunciante. También puede ser un producto o cualquier enlace https
  enlace_url text not null default '' check (char_length(enlace_url) <= 300 and (enlace_url = '' or enlace_url ~* '^https://')),
  boton_texto text not null default 'Ver tienda' check (char_length(boton_texto) between 1 and 30),
  municipio_id bigint references public.municipios (id) on delete set null,   -- null = todas las tiendas
  precio numeric(10, 2) check (precio is null or precio >= 0),
  activo boolean not null default true,
  inicia date,
  termina date,
  vistas integer not null default 0,
  clics integer not null default 0,
  creado_en timestamptz not null default now(),
  constraint publicidad_fechas check (inicia is null or termina is null or termina >= inicia)
);

alter table public.publicidad enable row level security;
drop policy if exists "admin panel publicidad" on public.publicidad;
create policy "admin panel publicidad" on public.publicidad
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- Publicidad que sale en una tienda
create or replace function public.publicidad_de_tienda(t bigint)
returns table (
  id bigint, anunciante_nombre text, titulo text, texto text, imagen_url text,
  enlace_url text, boton_texto text, slug text, dominio text
)
language sql stable security definer set search_path = '' as $$
  select p.id, p.anunciante_nombre, p.titulo, p.texto, p.imagen_url, p.enlace_url, p.boton_texto, an.slug, an.dominio
    from public.tiendas ti
    join public.publicidad p on true
    left join public.tiendas an on an.id = p.anunciante_tienda_id
   where ti.id = t and ti.activa
     -- Solo tiendas con un plan que muestra publicidad
     and exists (select 1 from public.clientes c join public.planes pl on pl.id = c.plan_id
                  where c.tienda_id = ti.id and pl.con_publicidad)
     and p.activo
     and (p.inicia is null or p.inicia <= (now() at time zone 'America/Tegucigalpa')::date)
     and (p.termina is null or p.termina >= (now() at time zone 'America/Tegucigalpa')::date)
     -- Nunca en la tienda que se anuncia
     and p.anunciante_tienda_id is distinct from ti.id
     -- Nunca en tiendas del mismo tipo de negocio ("Otro" compara lo que se escribió)
     and not (p.tipo_negocio_id is not null and p.tipo_negocio_id = ti.tipo_negocio_id
              and public.texto_busqueda(btrim(p.tipo_negocio_otro)) = public.texto_busqueda(btrim(ti.tipo_negocio_otro)))
     -- Solo en su municipio, si se eligió uno
     and (p.municipio_id is null or p.municipio_id = ti.municipio_id)
     and (p.anunciante_tienda_id is null or an.activa)
   order by p.id desc
   limit 10;
$$;
revoke execute on function public.publicidad_de_tienda(bigint) from public;
grant execute on function public.publicidad_de_tienda(bigint) to anon, authenticated;

-- Cuenta vistas y clics de cada publicidad
create or replace function public.contar_publicidad(p_id bigint, p_clic boolean)
returns void language sql security definer set search_path = '' as $$
  update public.publicidad
     set vistas = vistas + case when p_clic then 0 else 1 end,
         clics = clics + case when p_clic then 1 else 0 end
   where id = p_id;
$$;
revoke execute on function public.contar_publicidad(bigint, boolean) from public;
grant execute on function public.contar_publicidad(bigint, boolean) to anon, authenticated;

-- ===========================================================================
-- 6) Permisos de lectura y escritura (las reglas de arriba deciden quién ve qué)
-- ===========================================================================
grant select on public.departamentos, public.municipios to anon, authenticated;
grant select, insert, update, delete on public.municipios, public.mototaxistas, public.pagos_mototaxi, public.publicidad to authenticated;
