import type { ColorPlan } from "./types";

// Clases completas escritas aquí para que Tailwind las incluya.
export const COLOR_PLAN: Record<ColorPlan, { cabecera: string; insignia: string; borde: string }> = {
  azul: { cabecera: "bg-blue-700", insignia: "bg-blue-100 text-blue-800", borde: "border-blue-700" },
  naranja: { cabecera: "bg-marca-500", insignia: "bg-orange-100 text-orange-800", borde: "border-marca-500" },
  verde: { cabecera: "bg-green-600", insignia: "bg-green-100 text-green-800", borde: "border-green-600" },
  morado: { cabecera: "bg-purple-700", insignia: "bg-purple-100 text-purple-800", borde: "border-purple-700" },
  gris: { cabecera: "bg-gray-700", insignia: "bg-gray-200 text-gray-800", borde: "border-gray-700" },
};

export const NOMBRE_COLOR: Record<ColorPlan, string> = {
  azul: "Azul",
  naranja: "Naranja",
  verde: "Verde",
  morado: "Morado",
  gris: "Gris",
};
