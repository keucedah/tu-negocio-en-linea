# Tu Negocio en Línea HN

Plataforma SaaS de catálogos en línea: tu página, tu panel de clientes y la tienda de cada cliente en un solo proyecto (Next.js + Supabase).

- `supabase/vitrina.sql`: base de datos completa. Se ejecuta una vez en un proyecto de Supabase nuevo.
- `.env.example`: variables que van en Vercel. `SUPABASE_SERVICE_ROLE_KEY` solo en Vercel, nunca en GitHub ni con `NEXT_PUBLIC_`.
- Sin variables, el sitio abre en modo demostración con datos de ejemplo.

Los pasos completos están en la guía `guia-plataforma.pdf`.

## Actualizar de la 2.0 a la 2.1 (optimización)

1. En Supabase > SQL Editor pega todo `supabase/optimizacion-2.1.sql` y pulsa **Run**. Se puede correr más de una vez.
2. Sube estos archivos a GitHub como siempre; Vercel publica solo.

El orden importa: primero el SQL (la tienda nueva usa la búsqueda y el conteo de categorías de la base).
