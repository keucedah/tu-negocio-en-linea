# Tu Negocio en Línea HN

Plataforma SaaS de catálogos en línea: tu página, tu panel de clientes y la tienda de cada cliente en un solo proyecto (Next.js + Supabase).

- `supabase/vitrina.sql`: base de datos completa. Se ejecuta una vez en un proyecto de Supabase nuevo.
- `.env.example`: variables que van en Vercel. `SUPABASE_SERVICE_ROLE_KEY` solo en Vercel, nunca en GitHub ni con `NEXT_PUBLIC_`.
- Sin variables, el sitio abre en modo demostración con datos de ejemplo.

Los pasos completos están en la guía `guia-plataforma.pdf`.

## Novedades de la 2.2

**Antes de subir esta versión, ejecuta en Supabase > SQL Editor `supabase/actualizacion-2.2.sql`**
(y `optimizacion-2.1.sql` si todavía no lo hiciste). Agrega las columnas de precio y tallas; se puede
ejecutar más de una vez. Para instalar desde cero basta con `vitrina.sql`, que ya lo incluye.

Precio y tallas (panel del dueño y tienda):
- Casilla **Mostrar precio** al agregar o editar un producto. Si no se marca, la tienda no muestra precio.
- Casilla **Tiene tallas**: salen las tallas comunes (Ropa, Calzado, Pantalón, Niños, Bebé) para marcar y un
  campo para escribir las que falten ("46, Única…"). Hasta 40 tallas por producto.
- En la tienda, el precio y las tallas salen en la tarjeta. Con tallas, el botón dice **Elegir talla** y el
  cliente toca la suya; en la página del producto la talla es obligatoria. Cada talla va en su propia línea
  del carrito, y el mensaje de WhatsApp lleva talla, precio y total.
- La App 4.2 muestra lo mismo (ver su LEEME).

Movimiento:
- Página principal: el teléfono de la portada pasa solo por las pantallas de la tienda y muestra el aviso
  "¡Nuevo pedido!"; las secciones aparecen al bajar; las tarjetas de planes se levantan y el plan del medio
  sale como **Recomendado** (con tres planes o más).
- Tiendas: botón flotante de WhatsApp con pulso; tarjetas que aparecen al bajar, se levantan y hacen zoom;
  la foto vuela al carrito; etiqueta **Nuevo** en lo subido en los últimos 7 días (`DIAS_NUEVO`,
  `app/[tienda]/page.tsx`).
- Si el visitante activó "menos animaciones" en su teléfono o computadora, todo se ve quieto.

## Actualizar de la 2.0 a la 2.1 (optimización)

1. En Supabase > SQL Editor pega todo `supabase/optimizacion-2.1.sql` y pulsa **Run**. Se puede correr más de una vez.
2. Sube estos archivos a GitHub como siempre; Vercel publica solo.

El orden importa: primero el SQL (la tienda nueva usa la búsqueda y el conteo de categorías de la base).
