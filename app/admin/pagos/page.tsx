import Link from "next/link";
import BotonRecibo from "@/components/panel/BotonRecibo";
import { obtenerAjustes, obtenerClientes, obtenerPagos } from "@/lib/panel/datos";
import { datosRecibo, numeroRecibo } from "@/lib/panel/recibo";
import { NOMBRE_CONCEPTO, fechaCorta, lempiras } from "@/lib/negocio";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function Pagos() {
  const [pagos, clientes, ajustes] = await Promise.all([obtenerPagos(), obtenerClientes(), obtenerAjustes()]);
  const porId = new Map(clientes.map((c) => [c.id, c]));

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
                      {porId.get(p.cliente_id)?.negocio ?? "Cliente eliminado"}
                    </Link>
                    <p className="text-xs text-gray-500">
                      {[`N.º ${numeroRecibo(p)}`, fechaCorta(p.fecha), NOMBRE_CONCEPTO[p.concepto] + (p.meses > 1 ? ` (${p.meses} meses)` : ""), p.metodo].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="pt-1 font-semibold">{lempiras(p.monto)}</span>
                    <BotonRecibo datos={datosRecibo(p, porId.get(p.cliente_id), ajustes)} compacto />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
