-- =====================================================================
-- Tu Negocio en Línea HN · Actualización 2.6
-- App del mototaxista: Disponible / Ocupado.
-- En las tiendas salen los mototaxistas al día: los disponibles se pueden elegir
-- y los ocupados salen marcados "Ocupado" (no se pueden elegir).
-- Los suspendidos (sin pago al día) ya no aparecen.
--
-- Ejecútalo en el SQL Editor del proyecto "tu-negocio-en-linea", DESPUÉS de
-- actualizacion-2.5.sql. Se puede ejecutar más de una vez sin dañar nada.
-- =====================================================================

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
