/* eslint-disable @next/next/no-img-element */
// Marco de celular con una captura real de la tienda adentro.
// Las capturas están en public/capturas/ (576 px de ancho, sin la barra del navegador).

export default function Celular({ src, alt, prioridad = false }: { src: string; alt: string; prioridad?: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[260px] rounded-[2.2rem] bg-gray-900 p-2.5 shadow-2xl ring-1 ring-white/10">
      <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-b-xl bg-gray-900" />
      <div className="relative aspect-[9/17] overflow-hidden rounded-[1.7rem] bg-[#111827] pt-3">
        <img
          src={src}
          alt={alt}
          width={576}
          height={1076}
                    fetchPriority={prioridad ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
      </div>
    </div>
  );
}
