// Monto en letras para los recibos: 1500.5 → "Mil quinientos lempiras con 50/100".

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
  "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
  "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DECENAS = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

/** 0 a 999. `corto` usa "un"/"veintiún" (antes de "mil", "millones" o "lempiras"). */
function hasta999(n: number, corto: boolean): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  let resto: string;
  if (r < 30) resto = UNIDADES[r];
  else resto = DECENAS[Math.floor(r / 10)] + (r % 10 ? " y " + UNIDADES[r % 10] : "");
  if (corto) resto = resto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
  return [CENTENAS[c], resto].filter(Boolean).join(" ");
}

/** Número entero en letras, listo para ir antes de un sustantivo ("un lempira", "veintiún mil"). */
export function enteroEnLetras(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones) partes.push(millones === 1 ? "un millón" : hasta999(millones, true) + " millones");
  if (miles) partes.push(miles === 1 ? "mil" : hasta999(miles, true) + " mil");
  if (resto) partes.push(hasta999(resto, true));
  return partes.join(" ");
}

export function montoEnLetras(monto: number): string {
  const centavos = Math.round(Math.abs(monto) * 100);
  const entero = Math.floor(centavos / 100);
  const texto = `${enteroEnLetras(entero)} ${entero === 1 ? "lempira" : "lempiras"} con ${String(centavos % 100).padStart(2, "0")}/100`;
  // "un millón de lempiras", "dos millones de lempiras"
  const conDe = entero >= 1_000_000 && entero % 1_000_000 === 0 ? texto.replace(/(millón|millones) lempiras/, "$1 de lempiras") : texto;
  return conDe.charAt(0).toUpperCase() + conDe.slice(1);
}
