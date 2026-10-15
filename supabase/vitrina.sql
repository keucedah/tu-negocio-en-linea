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

-- ===========================================================================
-- Versión 2.2: precio y tallas opcionales en los productos.
-- ===========================================================================
alter table public.productos add column if not exists precio numeric(12, 2);
alter table public.productos add column if not exists tallas text[] not null default '{}';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_precio_check') then
    alter table public.productos add constraint productos_precio_check check (precio is null or precio >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_tallas_check') then
    alter table public.productos add constraint productos_tallas_check check (cardinality(tallas) <= 40);
  end if;
end $$;

-- ===========================================================================
-- Versión 2.3: recibos con serie por cliente (FESO-0001) y anuncios en las tiendas.
-- ===========================================================================
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


-- ===== Versión 2.4: banners en carrusel y color de la portada =====

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


-- ===== Versión 2.4.1: imagen para celular en los banners =====

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


-- =====================================================================
-- Versión 2.5: municipios, mototaxistas y publicidad
-- =====================================================================
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

-- "Servicio de mototaxi" lo prende o apaga solo el administrador, en la ficha del cliente (2.5.1)
alter table public.clientes add column if not exists ofrece_mototaxi boolean not null default true;
update public.clientes c set ofrece_mototaxi = t.ofrece_mototaxi
  from public.tiendas t
 where t.id = c.tienda_id and c.ofrece_mototaxi <> t.ofrece_mototaxi;
revoke update (ofrece_mototaxi) on public.tiendas from authenticated;

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

-- ===========================================================================
-- Versión 2.6: App del mototaxista (Disponible / Ocupado)
-- ===========================================================================

-- Ocupado hasta esta hora. Vacío o ya pasada = Disponible.
-- Al ponerse Ocupado se guarda "ahora + 2 horas": si se le olvida, vuelve solo a Disponible.
alter table public.mototaxistas add column if not exists ocupado_hasta timestamptz;

-- Mototaxistas que ve una tienda: los de su municipio (principal o extra) y al día. Sin la identidad.
-- "ocupado" = se puso Ocupado en su App. "suspendido" repite "ocupado" para que las apps 4.3
-- (que no conocen "ocupado") tampoco dejen elegirlo.
drop function if exists public.mototaxis_de_tienda(bigint);
create function public.mototaxis_de_tienda(t bigint)
returns table (
  id bigint, codigo text, nombre text, codigo_pais text, celular text, direccion text,
  numero_mototaxi text, foto_url text, foto_moto_url text, suspendido boolean, ocupado boolean
)
language sql stable security definer set search_path = '' as $$
  select m.id, m.codigo, m.nombre, m.codigo_pais, m.celular, m.direccion,
         m.numero_mototaxi, m.foto_url, m.foto_moto_url,
         coalesce(m.ocupado_hasta > now(), false), coalesce(m.ocupado_hasta > now(), false)
    from public.tiendas ti
    join public.mototaxistas m
      on m.activo and m.acepto_publicar
     and (m.municipio_id = ti.municipio_id or ti.municipio_id = any (m.municipios_extra))
   where ti.id = t and ti.activa and ti.ofrece_mototaxi and ti.municipio_id is not null
     -- Al día: pagado hasta hoy o después (hora de Honduras). Los suspendidos no salen.
     and m.pagado_hasta >= (now() at time zone 'America/Tegucigalpa')::date
   order by m.id;
$$;
revoke execute on function public.mototaxis_de_tienda(bigint) from public;
grant execute on function public.mototaxis_de_tienda(bigint) to anon, authenticated;

-- Todo lo que ve el mototaxista en su App (con su enlace personal). Sin la identidad.
create or replace function public.mototaxista_app(p_token uuid)
returns table (
  codigo text, nombre text, foto_url text, foto_moto_url text, numero_mototaxi text, municipio text,
  pagado_hasta date, activo boolean, acepto_publicar boolean, cuota numeric,
  veces_elegido integer, ocupado_hasta timestamptz, hoy date
)
language sql stable security definer set search_path = '' as $$
  select m.codigo, m.nombre, m.foto_url, m.foto_moto_url, m.numero_mototaxi,
         coalesce(mu.nombre || ', ' || d.nombre, ''),
         m.pagado_hasta, m.activo, m.acepto_publicar,
         coalesce(m.cuota_personalizada, (select a.cuota_mototaxi from public.ajustes_negocio a where a.id = 1)),
         m.veces_elegido,
         case when m.ocupado_hasta > now() then m.ocupado_hasta end,
         (now() at time zone 'America/Tegucigalpa')::date
    from public.mototaxistas m
    left join public.municipios mu on mu.id = m.municipio_id
    left join public.departamentos d on d.id = mu.departamento_id
   where m.token = p_token;
$$;
revoke execute on function public.mototaxista_app(uuid) from public;
grant execute on function public.mototaxista_app(uuid) to anon, authenticated;

-- El mototaxista se pone Ocupado (por 2 horas) o Disponible. Devuelve hasta cuándo queda ocupado (vacío = disponible).
-- Solo cambia su propia fila (la del enlace) y solo si no está dado de baja.
create or replace function public.mototaxista_ocupado(p_token uuid, p_ocupado boolean)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  v_hasta timestamptz := case when p_ocupado then now() + interval '2 hours' end;
begin
  update public.mototaxistas set ocupado_hasta = v_hasta where token = p_token and activo;
  if not found then
    raise exception 'Enlace no válido' using errcode = 'P0002';
  end if;
  return v_hasta;
end;
$$;
revoke execute on function public.mototaxista_ocupado(uuid, boolean) from public;
grant execute on function public.mototaxista_ocupado(uuid, boolean) to anon, authenticated;
