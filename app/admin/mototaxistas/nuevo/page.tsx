import Link from "next/link";
import FormularioMototaxista from "@/components/panel/FormularioMototaxista";
import { obtenerAjustes } from "@/lib/panel/datos";
import { obtenerUbicaciones } from "@/lib/panel/ubicaciones";
import { hoy } from "@/lib/negocio";

export default async function NuevoMototaxista() {
  const [ajustes, ubicaciones] = await Promise.all([obtenerAjustes(), obtenerUbicaciones()]);
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/mototaxistas" className="text-sm text-gray-500 hover:underline">← Volver a mototaxistas</Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Agregar mototaxista</h1>
      <div className="tarjeta">
        <FormularioMototaxista ubicaciones={ubicaciones} cuotaNormal={ajustes.cuota_mototaxi} hoy={hoy()} />
      </div>
    </div>
  );
}
