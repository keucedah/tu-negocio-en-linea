-- Tu Negocio en Línea HN — versión 2.2: precio y tallas opcionales en los productos.
-- Ejecútalo una vez en Supabase > SQL Editor, ANTES de subir el sitio 2.2 y la App 4.2.
-- Se puede ejecutar más de una vez sin problema. Los productos que ya existen quedan sin precio y sin tallas.

-- 1) Precio (vacío = la tienda no muestra precio y el cliente lo pregunta por WhatsApp)
alter table public.productos add column if not exists precio numeric(12, 2);

-- 2) Tallas que el cliente puede elegir (calzado, ropa, etc.). Lista vacía = el producto no tiene tallas.
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
