import type { Config } from "tailwindcss";

// "marca" y "encabezado" salen de variables CSS: cada tienda pone sus colores (lib/tema.ts).
const variable = (nombre: string) => `rgb(var(--${nombre}) / <alpha-value>)`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        marca: {
          50: variable("marca-50"),
          100: variable("marca-100"),
          400: variable("marca-400"),
          500: variable("marca-500"),
          600: variable("marca-600"),
          700: variable("marca-700"),
        },
        encabezado: {
          DEFAULT: variable("encabezado"),
          2: variable("encabezado-2"),
          texto: variable("encabezado-texto"),
        },
        marino: {
          700: "#1d3f8f",
          800: "#132d6b",
          900: "#0b1d45",
          950: "#071330",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
