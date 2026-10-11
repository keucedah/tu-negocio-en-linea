import Link from "next/link";
import { obtenerClientes, obtenerPagos } from "@/lib/panel/datos";
import { NOMBRE_CONCEPTO, fechaCorta, lempiras } from "@/lib/negocio";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function Pagos() {
  const [pagos, clientes] = await Promise.all([obtenerPagos(), obtenerClientes()]);
  const nombre = new Map(clientes.map((c) => [c.id, c.negocio]));

  // Agrupar por mes (AAAA-MM)
  const grupos = new Map<string, typeof pagos>();
  for (const p of pagos) {
    const k = p.fecha.slice(0, 7);
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pagos recibidos</h1>
      {pagos.length === 0 && <p className="tarjeta text-gray-600">Todavía no hay pagos. Regístralos desde la ficha de cada cliente.</p>}
      {[...grupos.entries()].map(([mes, lista]) => {
        const [a, m] = mes.split("-").map(Number);
        const total = lista.reduce((s, p) => s + p.monto, 0);
        return (
          <section key={mes} className="tarjeta">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-lg font-bold">{MESES[m - 1]} {a}</h2>
              <p className="text-lg font-black text-green-700">{lempiras(total)}</p>
            </div>
            <ul className="divide-y text-sm">
              {lista.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <Link href={`/admin/clientes/${p.cliente_id}`} className="font-semibold hover:underline">
                      {nombre.get(p.cliente_id) ?? "Cliente eliminado"}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {[fechaCorta(p.fecha), NOMBRE_CONCEPTO[p.concepto] + (p.meses > 1 ? ` (${p.meses} meses)` : ""), p.metodo].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="font-semibold">{lempiras(p.monto)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
