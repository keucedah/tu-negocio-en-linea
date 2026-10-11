/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Permite subir imágenes (productos, logo, banner) de hasta ~5 MB desde el panel de cada tienda
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Las imágenes de public/ no cambian: el navegador las guarda una semana.
  async headers() {
    return ["/capturas/:path*", "/icono.svg"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
    }));
  },
};

export default nextConfig;
