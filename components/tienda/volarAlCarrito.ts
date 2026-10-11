/**
 * Copia la foto del producto y la hace volar hasta el botón "Mi pedido" del encabezado.
 * Si no hay foto, botón del carrito o el cliente pidió menos movimiento, no hace nada.
 */
export function volarAlCarrito(boton: HTMLElement) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const tarjeta = boton.closest(".tarjeta-producto, [data-ficha]");
  const foto = tarjeta?.querySelector("img");
  const carrito = document.querySelector<HTMLElement>("[data-carrito]");
  if (!foto || !carrito || !foto.animate) return;

  const desde = foto.getBoundingClientRect();
  const hasta = carrito.getBoundingClientRect();
  if (desde.width === 0) return;

  const lado = Math.min(desde.width, desde.height, 160);
  const copia = foto.cloneNode() as HTMLImageElement;
  copia.removeAttribute("loading");
  Object.assign(copia.style, {
    position: "fixed",
    left: `${desde.left + (desde.width - lado) / 2}px`,
    top: `${desde.top + (desde.height - lado) / 2}px`,
    width: `${lado}px`,
    height: `${lado}px`,
    objectFit: "cover",
    borderRadius: "16px",
    zIndex: "60",
    pointerEvents: "none",
    boxShadow: "0 10px 25px rgb(0 0 0 / 0.25)",
  });
  document.body.appendChild(copia);

  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
  const vuelo = copia.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.55)`, opacity: 0.9, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0.4 },
    ],
    { duration: 700, easing: "cubic-bezier(.5,0,.4,1)" },
  );
  const quitar = () => copia.remove();
  vuelo.onfinish = quitar;
  vuelo.oncancel = quitar;
}
