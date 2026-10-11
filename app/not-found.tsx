import Link from "next/link";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <Link href="/" className="boton-primario mt-6">
        Ir al inicio
      </Link>
    </div>
  );
}
