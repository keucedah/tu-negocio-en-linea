/** Símbolo de la plataforma: una tiendita con toldo y señal de "en línea". */
export function Simbolo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#ea580c" />
      <path d="M10 19 12.5 11h23l2.5 8" fill="#fff" />
      <path d="M10 19a4.67 4.67 0 0 0 9.33 0 4.67 4.67 0 0 0 9.34 0A4.67 4.67 0 0 0 38 19z" fill="#fed7aa" />
      <path d="M13 24v13h22V24" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M21 37v-7h6v7" fill="#fff" />
      <circle cx="36.5" cy="11.5" r="5.5" fill="#22c55e" stroke="#ea580c" strokeWidth="2.5" />
    </svg>
  );
}

/** Nombre de la plataforma con su eslogan debajo. */
export default function Marca({
  nombre,
  eslogan,
  claro = false,
  className = "",
}: {
  nombre: string;
  eslogan?: string;
  /** true sobre fondo oscuro */
  claro?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Simbolo className="h-10 w-10 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className={`block truncate font-black ${claro ? "text-white" : "text-gray-900"}`}>{nombre}</span>
        {eslogan && <span className={`block truncate text-xs ${claro ? "text-gray-300" : "text-gray-500"}`}>{eslogan}</span>}
      </span>
    </span>
  );
}
