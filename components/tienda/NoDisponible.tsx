export default function NoDisponible({ nombre }: { nombre: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Tienda no disponible</h1>
      <p className="mt-2 text-gray-600">El catálogo de {nombre} no está disponible por el momento.</p>
    </div>
  );
}
