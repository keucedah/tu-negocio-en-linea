/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Permite subir imágenes (productos, logo, banner) de hasta ~5 MB desde el panel de cada tienda
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Las imágenes de public/ no cambian: el navegador las guarda una semana.
  async headers() {
    const cache = ["/capturas/:path*", "/icono.svg"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
    }));
    // Paneles y páginas para entrar: Google no debe mostrarlas (también en el dominio propio de cada tienda)
    const privadas = ["/admin", "/admin/:path*", "/entrar", "/:tienda/admin", "/:tienda/admin/:path*", "/:tienda/entrar"].map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
    return [...cache, ...privadas];
  },
};

export default nextConfig;
