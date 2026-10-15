# Tu Negocio en Línea HN

Plataforma SaaS de catálogos en línea: tu página, tu panel de clientes y la tienda de cada cliente en un solo proyecto (Next.js + Supabase).

- `supabase/vitrina.sql`: base de datos completa. Se ejecuta una vez en un proyecto de Supabase nuevo.
- `.env.example`: variables que van en Vercel. `SUPABASE_SERVICE_ROLE_KEY` solo en Vercel, nunca en GitHub ni con `NEXT_PUBLIC_`.
- Sin variables, el sitio abre en modo demostración con datos de ejemplo.

Los pasos completos están en la guía `guia-plataforma.pdf`.

## Novedades de la 2.5: mototaxis y publicidad

**Antes de subir el sitio**, ejecuta `supabase/actualizacion-2.5.sql` en el SQL Editor del proyecto
**tu-negocio-en-linea** (no en "ferreteria"). Se puede ejecutar más de una vez sin dañar nada.
Si subes el sitio sin el SQL, sigue funcionando pero sin las partes nuevas.

- **Municipios**: vienen los 18 departamentos y Langue (Valle). Agregas más desde Admin › Mototaxistas ›
  Municipios o al editar un cliente ("+ Nuevo municipio"); no deja repetir nombres.
- **Clientes**: "Dirección de la tienda" y municipio. **Asigna el municipio a cada cliente que ya tienes**,
  si no, su tienda no muestra mototaxistas.
- **Mototaxistas** (Admin › Mototaxistas): código automático MT-001, fotos de la persona y de la moto,
  permiso para publicar sus datos, municipios extra, cuota especial, pagos con recibo en PDF (MT001-0001),
  aviso de cobro por WhatsApp y un enlace personal donde ve su estado (`/mototaxi/...`, no sale en Google).
  Si no paga, sale en gris en las tiendas y no lo pueden elegir. La identidad nunca sale de la base de datos.
- **Tienda**: el carrito tiene "Enviar con mototaxi". El cliente elige un mototaxista de su municipio, se
  descarga una imagen con el pedido y se abre WhatsApp del mototaxista. Viene encendido en todas las tiendas.
  **Solo el administrador** lo apaga o enciende, en la ficha del cliente ("Servicio de mototaxi en su tienda").
  El dueño solo ve si está activado (2.5.1).
- **Publicidad** (Admin › Publicidad): anuncios pagados de otras tiendas u otros negocios. Salen solo en
  tiendas con un plan que tenga marcado "Muestra publicidad de otras tiendas" (Básico y Pro), nunca en la
  tienda que se anuncia ni en tiendas del mismo tipo de negocio. Se puede limitar a un municipio y a fechas.
  Cuenta vistas y clics. Los anuncios propios (sorteos y premios) siguen igual en todos los planes.
- **Ajustes**: mensualidad del mototaxista (L 50) y precio de carga extra de productos (L 150 por cada 50).
- **Página principal**: Instalación incluye "Te cargamos tus primeros 100 productos sin costo"; los planes
  sin publicidad lo dicen.

## Novedades de la 2.4.2: SEO (Google)

No cambia la base de datos ni la App.

- `robots.txt` y `sitemap.xml` se generan solos (`app/robots.ts` y `app/sitemap.ts`). El sitemap trae la página
  principal, cada tienda activa y todos sus productos, y se actualiza solo. **Borra `public/robots.txt` y
  `public/sitemap.xml` si los tienes**: chocan con los automáticos.
- Cada página tiene su dirección oficial (canónica) con www, título y descripción para Google y vista previa
  al compartir en WhatsApp y Facebook. Las páginas de producto llevan nombre, precio y foto.
- Los paneles y las páginas para entrar llevan "noindex": Google las saca de los resultados.
- En Vercel, `URL_SITIO` debe ser `https://www.tunegocioenlineahn.com` (con www).

## Novedades de la 2.4.1

**Antes de subir esta versión, ejecuta en Supabase > SQL Editor del proyecto tu-negocio-en-linea `supabase/actualizacion-2.4.1.sql`.**

- Cada banner puede tener, además, una imagen para celular de 1200 × 600 píxeles (2:1), con letras más grandes.
  En pantallas de menos de 640 píxeles de ancho (celular en vertical) se ve esa; en computadora, tablet o
  celular acostado se ve la de 1600 × 400. Es opcional: si no la subes, en el celular se ve la de computadora.
- El navegador descarga solo la imagen que va a mostrar.
- La App no cambia.

## Novedades de la 2.4

**Antes de subir esta versión, ejecuta en Supabase > SQL Editor del proyecto tu-negocio-en-linea `supabase/actualizacion-2.4.sql`.**

- Cada tienda puede tener hasta 3 banners. Con más de uno, pasan solos cada 4 segundos como carrusel,
  con puntitos para cambiar y deslizando con el dedo en el celular. Al pasar el puntero, el banner se
  agranda un poco y el carrusel se detiene.
- Los banners son más bajos (proporción 4:1, medida recomendada 1600 × 400 píxeles) y tienen el mismo ancho
  que las tarjetas de productos. Siempre se ven completos.
- En Apariencia se puede elegir el color de fondo del título y el texto de la portada, igual que el color
  principal y el de la barra. El color del texto se pone solo (oscuro o blanco) para que se lea bien.
- La App no cambia: sigue mostrando el primer banner.

## Novedades de la 2.3.1

El banner de la tienda se ve siempre completo, en su proporción (1600 × 600), en celular, computadora y con
cualquier zoom del navegador; ya no se corta arriba ni abajo. El título y el texto de la portada van en una
franja debajo del banner, para no tapar lo que trae la imagen. No cambia la base de datos ni la App: solo
sube `app/[tienda]/page.tsx` y `components/tienda/admin/FormularioApariencia.tsx` (y `package.json`).

## Novedades de la 2.3

**Antes de subir esta versión, ejecuta en Supabase > SQL Editor `supabase/actualizacion-2.3.sql`.**
Se puede ejecutar más de una vez. Para instalar desde cero basta con `vitrina.sql`, que ya lo incluye.
La App Android no cambia.

Recibos en PDF (panel de administración):
- Cada cliente tiene su serie de 4 letras, sacada de la primera letra de cada palabra del negocio
  (Ferretería El Sol → FESO), y su propia numeración: FESO-0001, FESO-0002… Si dos clientes dan las mismas
  letras, la del segundo termina en número (FES2). La serie no cambia aunque se cambie el nombre, y un número
  usado no se repite aunque se borre el pago. Los pagos que ya existían se numeran por fecha.
- Botones **Enviar recibo** y **PDF** en cada pago (ficha del cliente y pestaña Pagos). En el celular se
  comparte directo a WhatsApp; en la computadora se descarga y se abre el chat del cliente para arrastrarlo.
- El recibo lleva tus datos, los del cliente, concepto, plan, forma de pago, nota, total, el monto en letras
  y "Servicio pagado hasta". El plan y la fecha se guardan al registrar el pago, así el recibo no cambia después.

Anuncios (pestaña **Anuncios**):
- Sorteos, regalías y promociones con hasta 4 imágenes o un video por enlace, texto y botón
  **Quiero participar** (abre tu WhatsApp con el nombre del anuncio y de la tienda, o el enlace que pongas).
- Salen en un carrusel debajo de la portada de las tiendas (todas o las que elijas) y, si se marca, en tu
  página principal. Tienen botón **Compartir**, fechas de inicio y fin, y se pueden pausar.
- Medida recomendada de las imágenes: 1600 × 900 px (16:9). Se ajustan a cualquier pantalla y siempre se
  guardan en WebP (máximo 1600 px). No salen en la App.

## Novedades de la 2.2.1

Arreglo pequeño que salió en la prueba de carga: al abrir una tienda, el pie de página aparecía arriba y
saltaba hacia abajo cuando llegaba la lista de productos. Ahora la lista reserva su espacio desde el inicio
(`app/[tienda]/page.tsx`). No cambia la base de datos: solo sube los archivos.

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
