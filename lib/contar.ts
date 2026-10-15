// En el navegador: suma un contador sin esperar respuesta (ver app/api/contar).
export function contar(tipo: "mototaxi" | "vista" | "clic", id: number, base = "") {
  try {
    const cuerpo = JSON.stringify({ tipo, id });
    const url = `${base}/api/contar`;
    if (navigator.sendBeacon?.(url, new Blob([cuerpo], { type: "text/plain" }))) return;
    fetch(url, { method: "POST", body: cuerpo, keepalive: true }).catch(() => {});
  } catch {}
}
