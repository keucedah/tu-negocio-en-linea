# Tu Negocio en Línea HN

Plataforma SaaS de catálogos en línea: tu página, tu panel de clientes y la tienda de cada cliente en un solo proyecto (Next.js + Supabase).

- `supabase/vitrina.sql`: base de datos completa. Se ejecuta una vez en un proyecto de Supabase nuevo.
- `.env.example`: variables que van en Vercel. `SUPABASE_SERVICE_ROLE_KEY` solo en Vercel, nunca en GitHub ni con `NEXT_PUBLIC_`.
- Sin variables, el sitio abre en modo demostración con datos de ejemplo.

Los pasos completos están en la guía `guia-plataforma.pdf`.

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
