import Link from "next/link";
import ListaClientes from "@/components/panel/ListaClientes";
import { obtenerAjustes, obtenerClientes, obtenerPagos, obtenerPlanes, obtenerTipos } from "@/lib/panel/datos";
import { aFila } from "@/lib/panel/filas";
import { cuotaMensual, estadoCobro, hoy, lempiras } from "@/lib/negocio";

export default async function Clientes({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const [clientes, planes, ajustes, pagos, tipos] = await Promise.all([obtenerClientes(), obtenerPlanes(), obtenerAjustes(), obtenerPagos(), obtenerTipos()]);

  const vigentes = clientes.filter((c) => c.estado === "activo" || c.estado === "prueba");
  const cobros = clientes.map((c) => estadoCobro(c, ajustes.dias_aviso).estado);
  const mes = hoy().slice(0, 7);
  const cobradoMes = pagos.filter((p) => p.fecha.startsWith(mes)).reduce((s, p) => s + p.monto, 0);
  const mensualEsperado = clientes
    .filter((c) => c.estado === "activo")
    .reduce((s, c) => s + cuotaMensual(c, planes.find((p) => p.id === c.plan_id), ajustes), 0);

  const tarjetas = [
    { titulo: "Clientes activos", valor: String(vigentes.length), nota: `${clientes.length} en total`, href: "/admin" },
    { titulo: "Pagos vencidos", valor: String(cobros.filter((e) => e === "vencido").length), nota: "Cobrar hoy", clase: "text-red-600", href: "/admin?filtro=vencido" },
    { titulo: "Por vencer", valor: String(cobros.filter((e) => e === "por_vencer").length), nota: `Próximos ${ajustes.dias_aviso} días`, clase: "text-yellow-600", href: "/admin?filtro=por_vencer" },
    { titulo: "Cobrado este mes", valor: lempiras(cobradoMes), nota: `Esperado al mes: ${lempiras(mensualEsperado)}`, href: "/admin/pagos" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.titulo} href={t.href} className="tarjeta block hover:ring-2 hover:ring-marca-100">
            <p className="text-sm text-gray-500">{t.titulo}</p>
            <p className={`mt-1 text-2xl font-black ${t.clase ?? ""}`}>{t.valor}</p>
            <p className="text-xs text-gray-500">{t.nota}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link href="/admin/clientes/nuevo" className="boton-primario">+ Agregar cliente</Link>
      </div>

      {clientes.length === 0 ? (
        <div className="tarjeta text-center text-gray-600">
          Aún no tienes clientes. <Link href="/admin/clientes/nuevo" className="font-semibold text-marca-700 hover:underline">Agrega el primero</Link>.
        </div>
      ) : (
        <ListaClientes key={filtro ?? "todos"} filas={clientes.map((c) => aFila(c, planes, ajustes, tipos))} filtroInicial={filtro} />
      )}
    </div>
  );
}
