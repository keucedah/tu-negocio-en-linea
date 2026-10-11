import { randomInt } from "crypto";

// Sin letras que se confunden al dictarlas (0/O, 1/l/I).
const LETRAS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Contraseña inicial fácil de copiar: 10 caracteres. */
export function claveAleatoria(largo = 10): string {
  let c = "";
  for (let i = 0; i < largo; i++) c += LETRAS[randomInt(LETRAS.length)];
  return c;
}
