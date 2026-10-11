"use client";

export default function BotonEliminar({
  id,
  accion,
  confirmacion,
  texto = "Eliminar",
}: {
  id: number;
  accion: (fd: FormData) => Promise<void>;
  confirmacion: string;
  texto?: string;
}) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (!confirm(confirmacion)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
        {texto}
      </button>
    </form>
  );
}
