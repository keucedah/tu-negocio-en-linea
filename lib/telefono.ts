// Formato y validación del celular de la tienda.
// Se guarda como código de país + número nacional, solo dígitos (lo que pide WhatsApp).

export const PAISES = [
  { codigo: "54", nombre: "Argentina", digitos: [10] },
  { codigo: "591", nombre: "Bolivia", digitos: [8] },
  { codigo: "56", nombre: "Chile", digitos: [9] },
  { codigo: "57", nombre: "Colombia", digitos: [10] },
  { codigo: "506", nombre: "Costa Rica", digitos: [8] },
  { codigo: "53", nombre: "Cuba", digitos: [8] },
  { codigo: "593", nombre: "Ecuador", digitos: [9] },
  { codigo: "503", nombre: "El Salvador", digitos: [8] },
  { codigo: "34", nombre: "España", digitos: [9] },
  { codigo: "1", nombre: "EE. UU. / Puerto Rico / R. Dominicana", digitos: [10] },
  { codigo: "502", nombre: "Guatemala", digitos: [8] },
  { codigo: "504", nombre: "Honduras", digitos: [8] },
  { codigo: "52", nombre: "México", digitos: [10] },
  { codigo: "505", nombre: "Nicaragua", digitos: [8] },
  { codigo: "507", nombre: "Panamá", digitos: [8] },
  { codigo: "595", nombre: "Paraguay", digitos: [9] },
  { codigo: "51", nombre: "Perú", digitos: [9] },
  { codigo: "598", nombre: "Uruguay", digitos: [8] },
  { codigo: "58", nombre: "Venezuela", digitos: [10] },
] as const;

export type ResultadoCelular = { ok: true; codigo: string; nacional: string } | { ok: false; error: string };

/**
 * Limpia lo que escribió el administrador: quita espacios, guiones, paréntesis,
 * el "+código" si lo pegó completo y el 0 inicial de larga distancia.
 */
export function normalizarCelular(codigo: string, entrada: string): ResultadoCelular {
  const pais = PAISES.find((p) => p.codigo === codigo);
  if (!pais) return { ok: false, error: "Elige el país del celular." };

  let num = entrada.replace(/\D/g, "");
  if (!num) return { ok: true, codigo, nacional: "" }; // vacío = sin celular

  const conPrefijo = entrada.trim().startsWith("+") || entrada.trim().startsWith("00");
  if (num.startsWith("00")) num = num.slice(2);
  if ((conPrefijo || num.length > Math.max(...pais.digitos)) && num.startsWith(codigo)) num = num.slice(codigo.length);
  if (codigo === "52" && num.length === 11 && num.startsWith("1")) num = num.slice(1); // antiguo "521" de México
  if (codigo === "54" && num.length === 11 && num.startsWith("9")) num = num.slice(1); // "9" de celulares en Argentina
  if (num.startsWith("0")) num = num.replace(/^0+/, "");

  if (!(pais.digitos as readonly number[]).includes(num.length)) {
    return {
      ok: false,
      error: `El celular de ${pais.nombre} debe tener ${pais.digitos.join(" o ")} dígitos (sin el código de país). Escribiste ${num.length}.`,
    };
  }
  return { ok: true, codigo, nacional: num };
}

/** Número para el enlace de WhatsApp (wa.me). */
export function numeroWhatsApp(codigo: string, nacional: string) {
  if (!nacional) return "";
  if (codigo === "54") return `549${nacional}`; // WhatsApp usa 54 9 para celulares de Argentina
  return `${codigo}${nacional}`;
}

/** Formato legible, por ejemplo +52 55 1234 5678 o +56 9 1234 5678. */
export function formatearCelular(codigo: string, nacional: string) {
  if (!nacional) return "";
  const n = nacional;
  let cuerpo: string;
  if (codigo === "54" && n.length === 10) return `+54 9 ${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}`;
  if (n.length === 10) cuerpo = codigo === "52" ? `${n.slice(0, 2)} ${n.slice(2, 6)} ${n.slice(6)}` : `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  else if (n.length === 9) cuerpo = codigo === "56" ? `${n.slice(0, 1)} ${n.slice(1, 5)} ${n.slice(5)}` : `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  else if (n.length === 8) cuerpo = `${n.slice(0, 4)} ${n.slice(4)}`;
  else if (n.length === 7) cuerpo = `${n.slice(0, 3)} ${n.slice(3)}`;
  else cuerpo = n;
  return `+${codigo} ${cuerpo}`;
}
