-- Base de datos completa de la plataforma (tiendas de todos los clientes + tu panel).
-- Es para un proyecto de Supabase NUEVO y vacío:
-- Supabase > SQL Editor > New query > pegar todo este archivo > Run.
-- Se puede ejecutar más de una vez sin dañar nada.

-- ===========================================================================
-- 1. Administradores de la plataforma (tú)
-- ===========================================================================
create table if not exists public.panel_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.es_admin_panel()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.panel_admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.es_admin_panel() from public;
grant execute on function public.es_admin_panel() to anon, authenticated;

alter table public.panel_admins enable row level security;
drop policy if exists "ver propio registro panel" on public.panel_admins;
create policy "ver propio registro panel" on public.panel_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ===========================================================================
-- 2. Tipos de negocio (colores, portada y categorías sugeridas de cada uno)
-- ===========================================================================
create table if not exists public.tipos_negocio (
  id bigint generated always as identity primary key,
  nombre text not null unique check (char_length(nombre) between 1 and 60),
  color_principal text not null default '#ea580c' check (color_principal ~ '^#[0-9a-f]{6}$'),
  color_encabezado text not null default '#111827' check (color_encabezado ~ '^#[0-9a-f]{6}$'),
  titulo_portada text not null default '' check (char_length(titulo_portada) <= 80),
  texto_portada text not null default '' check (char_length(texto_portada) <= 200),
  texto_buscador text not null default '' check (char_length(texto_buscador) <= 60),
  categorias text not null default '' check (char_length(categorias) <= 1000),
  orden smallint not null default 0,
  activo boolean not null default true
);

insert into public.tipos_negocio (nombre, color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, categorias, orden) values
  ('Ferretería', '#ea580c', '#111827', 'Todo para tu obra y tu hogar',
   'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.',
   'Busca martillo, tornillos, pintura…',
   E'Herramientas manuales\nHerramientas eléctricas\nTornillería y fijaciones\nPinturas\nElectricidad\nPlomería', 1),
  ('Abarrotería / pulpería', '#16a34a', '#14532d', 'Todo para tu despensa',
   'Granos, lácteos, bebidas y productos de limpieza. Haz tu pedido por WhatsApp y te lo tenemos listo.',
   'Busca arroz, aceite, jabón…',
   E'Granos básicos\nLácteos y huevos\nBebidas\nSnacks y dulces\nLimpieza\nCuidado personal', 2),
  ('Ropa y calzado', '#7c3aed', '#1e1b4b', 'Viste a tu estilo',
   'Ropa y calzado para toda la familia. Elige tus favoritos y pídelos por WhatsApp.',
   'Busca camisas, jeans, tenis…',
   E'Damas\nCaballeros\nNiños\nCalzado\nAccesorios', 3),
  ('Perfumería y belleza', '#db2777', '#4a044e', 'Belleza que se nota',
   'Maquillaje, cuidado de la piel, cabello y perfumes. Pide por WhatsApp y te lo apartamos.',
   'Busca tu labial, crema o shampoo…',
   E'Maquillaje\nCuidado facial\nCabello\nUñas\nPerfumes\nAccesorios', 4),
  ('Farmacia', '#0891b2', '#083344', 'Tu salud, a un mensaje',
   'Medicamentos de venta libre, vitaminas y cuidado personal. Consulta disponibilidad por WhatsApp.',
   'Busca acetaminofén, vitaminas…',
   E'Medicamentos\nVitaminas\nCuidado personal\nBebés\nPrimeros auxilios', 5),
  ('Librería y papelería', '#2563eb', '#172554', 'Todo para estudiar y trabajar',
   'Útiles escolares, papelería y artículos de oficina. Arma tu lista y envíala por WhatsApp.',
   'Busca cuadernos, lápices, colores…',
   E'Útiles escolares\nCuadernos\nArte y manualidades\nOficina\nMochilas', 6),
  ('Repuestos moto y carro', '#dc2626', '#1c1917', 'El repuesto que buscas',
   'Repuestos y accesorios para moto y carro. Cotiza por WhatsApp con el modelo de tu vehículo.',
   'Busca bujía, filtro, llanta…',
   E'Motor\nFrenos\nLlantas\nAceites y lubricantes\nEléctrico\nAccesorios', 7),
  ('Celulares y accesorios', '#4f46e5', '#0f172a', 'Conectado siempre',
   'Celulares, cargadores, audífonos y accesorios. Pregunta precio y disponibilidad por WhatsApp.',
   'Busca cargador, funda, audífonos…',
   E'Celulares\nCargadores y cables\nAudio\nFundas y protectores\nAccesorios', 8),
  ('Agroveterinaria', '#65a30d', '#1a2e05', 'Todo para tu campo y tus animales',
   'Alimentos, medicinas veterinarias, semillas y herramientas de campo. Pide por WhatsApp.',
   'Busca concentrado, vacuna, semilla…',
   E'Alimento para animales\nMedicina veterinaria\nSemillas\nFertilizantes\nHerramientas de campo', 9),
  ('Mueblería y electrodomésticos', '#b45309', '#292524', 'Equipa tu hogar',
   'Muebles y electrodomésticos para cada espacio. Cotiza por WhatsApp y pregunta por facilidades.',
   'Busca refrigeradora, sala, cama…',
   E'Salas\nComedores\nDormitorios\nLínea blanca\nElectrónica\nCocina', 10),
  ('Otro', '#0d9488', '#134e4a', 'Bienvenido a nuestra tienda',
   'Explora el catálogo, agrega lo que necesitas al carrito y envíanos tu pedido por WhatsApp.',
   'Buscar producto…', '', 99)
on conflict (nombre) do nothing;

alter table public.tipos_negocio enable row level security;
drop policy if exists "tipos publicos" on public.tipos_negocio;
create policy "tipos publicos" on public.tipos_negocio
  for select to anon, authenticated using (true);
drop policy if exists "admin panel tipos" on public.tipos_negocio;
create policy "admin panel tipos" on public.tipos_negocio
  for all to authenticated
  using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- ===========================================================================
-- 3. Planes, datos de tu negocio, clientes, pagos y solicitudes
-- ===========================================================================
create table if not exists public.planes (
  id bigint generated always as identity primary key,
  nombre text not null unique check (char_length(nombre) between 1 and 40),
  subtitulo text not null default '' check (char_length(subtitulo) <= 80),
  precio_mensual numeric(10, 2) not null check (precio_mensual >= 0),
  limite_productos integer not null check (limite_productos > 0),
  caracteristicas text not null default '' check (char_length(caracteristicas) <= 1000),
  color text not null default 'azul' check (color in ('azul', 'naranja', 'verde', 'morado', 'gris')),
  orden smallint not null default 0,
  visible boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into public.planes (nombre, subtitulo, precio_mensual, limite_productos, caracteristicas, color, orden) values
  ('Básico', 'Para negocios pequeños', 250, 2000,
   E'Catálogo web y panel de tu tienda\nTus colores, logo y banner\nPedidos por WhatsApp', 'azul', 1),
  ('Pro', 'Negocios en crecimiento', 500, 10000,
   E'Todo lo del Básico\nCarrusel de productos destacados\nApp Android con tu marca', 'naranja', 2),
  ('Pro Plus', 'Alto volumen', 800, 50000,
   E'Todo lo del Pro\nDominio propio\nSoporte prioritario', 'verde', 3)
on conflict (nombre) do nothing;

create table if not exists public.ajustes_negocio (
  id smallint primary key default 1 check (id = 1),
  nombre_negocio text not null default 'Tu Negocio en Línea HN' check (char_length(nombre_negocio) between 1 and 60),
  eslogan text not null default 'Plataforma SaaS de catálogos en línea' check (char_length(eslogan) <= 80),
  codigo_pais text not null default '504' check (codigo_pais ~ '^[0-9]{1,4}$'),
  celular text not null default '88839869' check (celular ~ '^[0-9]{0,14}$'),
  correo text not null default 'kenrakasth2009@gmail.com' check (char_length(correo) <= 120),
  direccion text not null default 'Barrio El Calvario, Langue, Valle, Honduras' check (char_length(direccion) <= 200),
  precio_instalacion numeric(10, 2) not null default 2500 check (precio_instalacion >= 0),
  precio_dominio numeric(10, 2) not null default 135 check (precio_dominio >= 0),
  dias_aviso smallint not null default 5 check (dias_aviso between 0 and 60),
  plantilla_cobro text not null default
    E'Hola {contacto}, le saluda {mi_negocio}.\nLe recordamos que el pago mensual de su tienda en línea ({negocio}) por *{monto}* ({plan}) vence el *{fecha}*.\nPuede pagar por transferencia o en efectivo. Al pagar, envíenos el comprobante por aquí. ¡Gracias por su preferencia!'
    check (char_length(plantilla_cobro) <= 1500),
  plantilla_vencido text not null default
    E'Hola {contacto}, le saluda {mi_negocio}.\nEl pago de su tienda en línea ({negocio}) por *{monto}* venció el *{fecha}*.\nPara evitar la suspensión del servicio, le pedimos realizar el pago a la brevedad. Si ya pagó, envíenos el comprobante y disculpe la molestia.'
    check (char_length(plantilla_vencido) <= 1500),
  plantilla_recibo text not null default
    E'Hola {contacto}, le saluda {mi_negocio}.\nConfirmamos su pago de *{monto}* recibido el {fecha_pago}.\nSu próximo pago es el *{fecha}*. ¡Gracias!'
    check (char_length(plantilla_recibo) <= 1500),
  actualizado_en timestamptz not null default now()
);

insert into public.ajustes_negocio (id) values (1) on conflict (id) do nothing;

-- ===========================================================================
-- 4. Tiendas de los clientes
-- ===========================================================================
create table if not exists public.tiendas (
  id bigint generated by default as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  nombre_tienda text not null default 'Mi tienda' check (char_length(nombre_tienda) between 1 and 60),
  logo_url text,
  logo_path text,
  codigo_pais text not null default '504' check (codigo_pais ~ '^[0-9]{1,4}$'),
  celular text not null default '' check (celular ~ '^[0-9]{0,14}$'),
  dominio text unique check (dominio is null or dominio ~ '^[a-z0-9.-]{3,120}$'),
  activa boolean not null default true,
  nombre_plan text not null default '' check (char_length(nombre_plan) <= 40),
  limite_productos integer not null default 2000 check (limite_productos > 0),
  -- Tipo de negocio (lo eliges tú en el panel)
  tipo_negocio_id bigint references public.tipos_negocio (id) on delete set null,
  tipo_negocio_otro text not null default '' check (char_length(tipo_negocio_otro) <= 60),
  -- Apariencia (la cambia el dueño en su panel)
  color_principal text not null default '#ea580c' check (color_principal ~ '^#[0-9a-f]{6}$'),
  color_encabezado text not null default '#111827' check (color_encabezado ~ '^#[0-9a-f]{6}$'),
  titulo_portada text not null default '' check (char_length(titulo_portada) <= 80),
  texto_portada text not null default '' check (char_length(texto_portada) <= 200),
  texto_buscador text not null default '' check (char_length(texto_buscador) <= 60),
  banner_url text,
  banner_path text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists tiendas_tipo_negocio_id_idx on public.tiendas (tipo_negocio_id);

create table if not exists public.tienda_admins (
  tienda_id bigint not null references public.tiendas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (tienda_id, user_id)
);
create index if not exists tienda_admins_user_id_idx on public.tienda_admins (user_id);

create table if not exists public.clientes (
  id bigint generated always as identity primary key,
  negocio text not null check (char_length(negocio) between 1 and 120),
  contacto text not null default '' check (char_length(contacto) <= 120),
  codigo_pais text not null default '504' check (codigo_pais ~ '^[0-9]{1,4}$'),
  celular text not null default '' check (celular ~ '^[0-9]{0,14}$'),
  correo text not null default '' check (char_length(correo) <= 120),
  direccion text not null default '' check (char_length(direccion) <= 200),
  sitio_url text not null default '' check (char_length(sitio_url) <= 200),
  dominio text not null default '' check (char_length(dominio) <= 120),
  plan_id bigint references public.planes (id) on delete restrict,
  tipo_negocio_id bigint references public.tipos_negocio (id) on delete set null,
  tipo_negocio_otro text not null default '' check (char_length(tipo_negocio_otro) <= 60),
  con_dominio boolean not null default false,
  limite_personalizado integer check (limite_personalizado is null or limite_personalizado > 0),
  cuota_personalizada numeric(10, 2) check (cuota_personalizada is null or cuota_personalizada >= 0),
  estado text not null default 'activo' check (estado in ('prueba', 'activo', 'suspendido', 'cancelado')),
  fecha_inicio date not null default current_date,
  proximo_pago date,
  instalacion_pagada boolean not null default false,
  notas text not null default '' check (char_length(notas) <= 2000),
  tienda_id bigint references public.tiendas (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists clientes_plan_id_idx on public.clientes (plan_id);
create index if not exists clientes_tipo_negocio_id_idx on public.clientes (tipo_negocio_id);
create index if not exists clientes_proximo_pago_idx on public.clientes (proximo_pago);
create unique index if not exists clientes_tienda_id_idx on public.clientes (tienda_id) where tienda_id is not null;

create table if not exists public.pagos (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes (id) on delete cascade,
  fecha date not null default current_date,
  monto numeric(10, 2) not null check (monto > 0),
  concepto text not null default 'mensualidad' check (concepto in ('mensualidad', 'instalacion', 'dominio', 'otro')),
  meses smallint not null default 1 check (meses between 0 and 24),
  metodo text not null default '' check (char_length(metodo) <= 40),
  nota text not null default '' check (char_length(nota) <= 300),
  creado_en timestamptz not null default now()
);
create index if not exists pagos_cliente_id_idx on public.pagos (cliente_id);
create index if not exists pagos_fecha_idx on public.pagos (fecha desc);

create table if not exists public.solicitudes_demo (
  id bigint generated always as identity primary key,
  nombre text not null check (char_length(nombre) between 1 and 80),
  negocio text not null default '' check (char_length(negocio) <= 120),
  celular text not null default '' check (celular ~ '^[0-9+ ]{0,20}$'),
  mensaje text not null default '' check (char_length(mensaje) <= 500),
  atendida boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists solicitudes_demo_creado_en_idx on public.solicitudes_demo (creado_en desc);

-- ===========================================================================
-- 5. Catálogo: categorías y productos de cada tienda
-- ===========================================================================
create table if not exists public.categorias (
  id bigint generated always as identity primary key,
  tienda_id bigint not null references public.tiendas (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  creado_en timestamptz not null default now()
);
create unique index if not exists categorias_tienda_nombre_idx on public.categorias (tienda_id, nombre);
create unique index if not exists categorias_id_tienda_idx on public.categorias (id, tienda_id);

create table if not exists public.productos (
  id bigint generated always as identity primary key,
  tienda_id bigint not null references public.tiendas (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 150),
  descripcion text not null default '' check (char_length(descripcion) <= 3000),
  categoria_id bigint,
  imagen_url text,
  imagen_path text,
  -- Productos más vendidos: salen en el carrusel de arriba
  destacado boolean not null default false,
  orden_destacado smallint not null default 0,
  creado_en timestamptz not null default now(),
  constraint productos_categoria_tienda_fkey foreign key (categoria_id, tienda_id)
    references public.categorias (id, tienda_id) on delete set null (categoria_id)
);
create index if not exists productos_tienda_creado_idx on public.productos (tienda_id, creado_en desc);
create index if not exists productos_destacados_idx on public.productos (tienda_id, orden_destacado) where destacado;

-- ===========================================================================
-- 6. Permisos
-- ===========================================================================
-- Tiendas que el usuario puede administrar (todas si eres administrador de la plataforma).
create or replace function public.tiendas_administradas()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select t.id from public.tiendas t where (select public.es_admin_panel())
  union
  select a.tienda_id from public.tienda_admins a where a.user_id = (select auth.uid());
$$;

-- Tiendas cuyo catálogo se puede ver: las activas, más las propias aunque estén suspendidas.
create or replace function public.tiendas_visibles()
returns setof bigint
language sql
stable
security definer
set search_path = ''
as $$
  select t.id from public.tiendas t where t.activa
  union
  select public.tiendas_administradas();
$$;

create or replace function public.es_admin_tienda(t bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select t in (select public.tiendas_administradas());
$$;

-- Tienda dueña de una imagen: "5/abc.webp" es de la tienda 5.
create or replace function public.tienda_de_ruta(ruta text)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case when split_part(ruta, '/', 1) ~ '^[0-9]{1,18}$' then split_part(ruta, '/', 1)::bigint end;
$$;

revoke execute on function public.tiendas_administradas() from public;
revoke execute on function public.tiendas_visibles() from public;
revoke execute on function public.es_admin_tienda(bigint) from public;
grant execute on function public.tiendas_administradas() to anon, authenticated;
grant execute on function public.tiendas_visibles() to anon, authenticated;
grant execute on function public.es_admin_tienda(bigint) to anon, authenticated;
grant execute on function public.tienda_de_ruta(text) to anon, authenticated;

-- Límite de productos del plan; nada se mueve a otra tienda; máximo 12 destacados.
create or replace function public.revisar_tienda_productos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lim integer;
  plan text;
  total integer;
begin
  if tg_op = 'UPDATE' and new.tienda_id <> old.tienda_id then
    raise exception 'Un producto no se puede pasar a otra tienda.' using errcode = 'P0001';
  end if;

  if tg_op = 'INSERT' then
    select limite_productos, nombre_plan into lim, plan from public.tiendas where id = new.tienda_id;
    perform pg_advisory_xact_lock(hashtext('public.productos.limite'), new.tienda_id::integer);
    select count(*) into total from public.productos where tienda_id = new.tienda_id;
    if total >= lim then
      raise exception 'Llegaste al límite de % productos de tu plan%. Para agregar más, pide un cambio de plan.',
        lim, case when plan <> '' then ' ' || plan else '' end
        using errcode = 'P0001';
    end if;
  end if;

  if new.destacado and (tg_op = 'INSERT' or not old.destacado) then
    perform pg_advisory_xact_lock(hashtext('public.productos.destacados'), new.tienda_id::integer);
    select count(*) into total from public.productos where tienda_id = new.tienda_id and destacado and id <> new.id;
    if total >= 12 then
      raise exception 'Puedes tener hasta 12 productos destacados. Quita uno para agregar otro.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tienda_productos on public.productos;
create trigger tienda_productos before insert or update of tienda_id, destacado on public.productos
  for each row execute function public.revisar_tienda_productos();

create or replace function public.fijar_tienda_categoria()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tienda_id <> old.tienda_id then
    raise exception 'Una categoría no se puede pasar a otra tienda.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists tienda_categorias on public.categorias;
create trigger tienda_categorias before update of tienda_id on public.categorias
  for each row execute function public.fijar_tienda_categoria();

-- Seguridad por filas (RLS) -------------------------------------------------
alter table public.planes enable row level security;
alter table public.ajustes_negocio enable row level security;
alter table public.clientes enable row level security;
alter table public.pagos enable row level security;
alter table public.solicitudes_demo enable row level security;
alter table public.tiendas enable row level security;
alter table public.tienda_admins enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;

-- Página pública: planes visibles y tus datos de contacto
drop policy if exists "planes publicos" on public.planes;
create policy "planes publicos" on public.planes
  for select to anon, authenticated using (visible or (select public.es_admin_panel()));
drop policy if exists "ajustes publicos" on public.ajustes_negocio;
create policy "ajustes publicos" on public.ajustes_negocio
  for select to anon, authenticated using (true);
drop policy if exists "enviar solicitud" on public.solicitudes_demo;
create policy "enviar solicitud" on public.solicitudes_demo
  for insert to anon, authenticated with check (atendida = false);

-- Solo tú gestionas planes, ajustes, clientes, pagos y solicitudes
drop policy if exists "admin panel planes" on public.planes;
create policy "admin panel planes" on public.planes
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));
drop policy if exists "admin panel ajustes" on public.ajustes_negocio;
create policy "admin panel ajustes" on public.ajustes_negocio
  for update to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));
drop policy if exists "admin panel clientes" on public.clientes;
create policy "admin panel clientes" on public.clientes
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));
drop policy if exists "admin panel pagos" on public.pagos;
create policy "admin panel pagos" on public.pagos
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));
drop policy if exists "admin panel solicitudes" on public.solicitudes_demo;
create policy "admin panel solicitudes" on public.solicitudes_demo
  for all to authenticated using ((select public.es_admin_panel())) with check ((select public.es_admin_panel()));

-- Tiendas: todos ven sus datos públicos (nombre, logo, colores, portada)
drop policy if exists "tiendas publicas" on public.tiendas;
create policy "tiendas publicas" on public.tiendas
  for select to anon, authenticated using (true);

-- El dueño cambia solo nombre, logo, celular, colores y portada.
-- Plan, límite, dirección, dominio, tipo de negocio y si está activa se cambian desde tu panel.
revoke insert, update, delete on public.tiendas from anon, authenticated;
grant update (nombre_tienda, logo_url, logo_path, codigo_pais, celular,
              color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador,
              banner_url, banner_path, actualizado_en)
  on public.tiendas to authenticated;

drop policy if exists "dueno edita tienda" on public.tiendas;
create policy "dueno edita tienda" on public.tiendas
  for update to authenticated
  using (id in (select public.tiendas_administradas()))
  with check (id in (select public.tiendas_administradas()));

drop policy if exists "ver propias tiendas" on public.tienda_admins;
create policy "ver propias tiendas" on public.tienda_admins
  for select to authenticated using (user_id = (select auth.uid()) or (select public.es_admin_panel()));
revoke insert, update, delete on public.tienda_admins from anon, authenticated;

-- Catálogo: se ve el de las tiendas activas; cada dueño modifica solo el suyo
drop policy if exists "catalogo publico categorias" on public.categorias;
create policy "catalogo publico categorias" on public.categorias
  for select to anon, authenticated using (tienda_id in (select public.tiendas_visibles()));
drop policy if exists "catalogo publico productos" on public.productos;
create policy "catalogo publico productos" on public.productos
  for select to anon, authenticated using (tienda_id in (select public.tiendas_visibles()));

drop policy if exists "admin gestiona categorias" on public.categorias;
create policy "admin gestiona categorias" on public.categorias
  for all to authenticated
  using (tienda_id in (select public.tiendas_administradas()))
  with check (tienda_id in (select public.tiendas_administradas()));
drop policy if exists "admin gestiona productos" on public.productos;
create policy "admin gestiona productos" on public.productos
  for all to authenticated
  using (tienda_id in (select public.tiendas_administradas()))
  with check (tienda_id in (select public.tiendas_administradas()));

-- ===========================================================================
-- 7. Imágenes (productos, logos y banners). Cada tienda en su carpeta "5/..."
-- ===========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tienda sube imagenes" on storage.objects;
create policy "tienda sube imagenes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagenes' and public.tienda_de_ruta(name) in (select public.tiendas_administradas()));
drop policy if exists "tienda actualiza imagenes" on storage.objects;
create policy "tienda actualiza imagenes" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagenes' and public.tienda_de_ruta(name) in (select public.tiendas_administradas()));
drop policy if exists "tienda borra imagenes" on storage.objects;
create policy "tienda borra imagenes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagenes' and public.tienda_de_ruta(name) in (select public.tiendas_administradas()));
drop policy if exists "tienda ve imagenes" on storage.objects;
create policy "tienda ve imagenes" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagenes' and public.tienda_de_ruta(name) in (select public.tiendas_administradas()));

-- ===========================================================================
-- 8. Tu cuenta como administrador de la plataforma
-- ===========================================================================
-- Crea primero tu usuario en Authentication > Users con este correo.
-- Si lo creas después, vuelve a ejecutar solo esta línea.
insert into public.panel_admins (user_id)
select id from auth.users where email = 'kenrakasth2009@gmail.com'
on conflict (user_id) do nothing;

-- ============================================================
-- Versión 2.1: optimización (prueba de estrés de 50 tiendas)
-- ============================================================

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
