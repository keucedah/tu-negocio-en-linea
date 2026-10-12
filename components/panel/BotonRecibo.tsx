"use client";

import { useState } from "react";
import { montoEnLetras } from "@/lib/montoEnLetras";
import type { DatosRecibo } from "@/lib/panel/recibo";

const NARANJA: [number, number, number] = [234, 88, 12];
const GRIS: [number, number, number] = [100, 116, 139];
const OSCURO: [number, number, number] = [30, 41, 59];

const dinero = (n: number) => "L " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** El logo (icono.svg) pasado a PNG para ponerlo en el PDF. */
async function logoPng(): Promise<string | null> {
  try {
    const img = new Image();
    img.src = "/icono.svg";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    canvas.getContext("2d")?.drawImage(img, 0, 0, 192, 192);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

async function crearPdf(d: DatosRecibo): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a5" }); // 148 × 210 mm, cómodo de leer en el celular
  const ancho = 148;
  const m = 12;
  pdf.setProperties({ title: `Recibo N.º ${d.numero}`, author: d.emisor.nombre, creator: d.emisor.nombre });

  // Encabezado naranja con logo, nombre y número de recibo
  pdf.setFillColor(...NARANJA);
  pdf.rect(0, 0, ancho, 34, "F");
  const logo = await logoPng();
  if (logo) pdf.addImage(logo, "PNG", m, 8, 18, 18);
  const xNombre = logo ? m + 22 : m;
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(pdf.splitTextToSize(d.emisor.nombre, 62), xNombre, 15);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  if (d.emisor.eslogan) pdf.text(pdf.splitTextToSize(d.emisor.eslogan, 62), xNombre, 22);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("RECIBO", ancho - m, 14, { align: "right" });
  pdf.setFontSize(11);
  pdf.text(`N.º ${d.numero}`, ancho - m, 21, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(d.fecha, ancho - m, 27, { align: "right" });

  // Datos de contacto del emisor
  let y = 41;
  pdf.setTextColor(...GRIS);
  pdf.setFontSize(8);
  const contacto = [d.emisor.direccion, d.emisor.celular && `Tel. ${d.emisor.celular}`, d.emisor.correo].filter(Boolean).join("   ·   ");
  if (contacto) {
    pdf.text(pdf.splitTextToSize(contacto, ancho - 2 * m), ancho / 2, y, { align: "center" });
    y += 8;
  }

  // Recibido de
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(248, 250, 252);
  const filasCliente = [
    d.cliente.contacto && ["Contacto", d.cliente.contacto],
    d.cliente.celular && ["Celular", d.cliente.celular],
    d.cliente.correo && ["Correo", d.cliente.correo],
    d.cliente.direccion && ["Dirección", d.cliente.direccion],
  ].filter(Boolean) as [string, string][];
  const altoCliente = 16 + filasCliente.length * 5.5;
  pdf.roundedRect(m, y, ancho - 2 * m, altoCliente, 2, 2, "FD");
  pdf.setFontSize(8);
  pdf.setTextColor(...GRIS);
  pdf.text("RECIBIMOS DE", m + 4, y + 6);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...OSCURO);
  pdf.text(pdf.splitTextToSize(d.cliente.negocio, ancho - 2 * m - 8)[0], m + 4, y + 12);
  pdf.setFontSize(9);
  filasCliente.forEach(([k, v], i) => {
    const yy = y + 18 + i * 5.5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...GRIS);
    pdf.text(k, m + 4, yy);
    pdf.setTextColor(...OSCURO);
    pdf.text(pdf.splitTextToSize(v, ancho - 2 * m - 32)[0], m + 26, yy);
  });
  y += altoCliente + 8;

  // Detalle del pago
  pdf.setFillColor(...OSCURO);
  pdf.rect(m, y, ancho - 2 * m, 7, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("CONCEPTO", m + 3, y + 4.8);
  pdf.text("MONTO", ancho - m - 3, y + 4.8, { align: "right" });
  y += 7;
  pdf.setTextColor(...OSCURO);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(d.concepto, m + 3, y + 6);
  pdf.text(dinero(d.monto), ancho - m - 3, y + 6, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...GRIS);
  let yDet = y + 11;
  const detalles = [d.plan && `Plan: ${d.plan}`, d.metodo && `Forma de pago: ${d.metodo}`, d.nota && `Nota: ${d.nota}`].filter(Boolean) as string[];
  for (const t of detalles) {
    const lineas = pdf.splitTextToSize(t, ancho - 2 * m - 40) as string[];
    pdf.text(lineas, m + 3, yDet);
    yDet += lineas.length * 4.2;
  }
  y = Math.max(yDet, y + 12) + 2;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(m, y, ancho - m, y);

  // Total y monto en letras
  y += 4;
  pdf.setFillColor(255, 237, 213);
  pdf.roundedRect(ancho - m - 62, y, 62, 13, 2, 2, "F");
  pdf.setTextColor(...NARANJA);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("TOTAL PAGADO", ancho - m - 58, y + 8.3);
  pdf.setFontSize(13);
  pdf.text(dinero(d.monto), ancho - m - 3, y + 8.6, { align: "right" });
  y += 19;
  pdf.setTextColor(...OSCURO);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  const letras = pdf.splitTextToSize(`Son: ${montoEnLetras(d.monto)}`, ancho - 2 * m) as string[];
  pdf.text(letras, m, y);
  y += letras.length * 4.5 + 4;

  // Pagado hasta
  if (d.pagadoHasta) {
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(m, y, ancho - 2 * m, 11, 2, 2, "F");
    pdf.setTextColor(21, 128, 61);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(`Servicio pagado hasta el ${d.pagadoHasta}`, ancho / 2, y + 7, { align: "center" });
    y += 17;
  }

  // Pie
  pdf.setTextColor(...GRIS);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("¡Gracias por su pago!", ancho / 2, 192, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(`${d.emisor.nombre} · Recibo N.º ${d.numero} · ${d.fecha}`, ancho / 2, 198, { align: "center" });
  pdf.setFillColor(...NARANJA);
  pdf.rect(0, 205, ancho, 5, "F");

  return pdf.output("blob");
}

/** Botón que arma el recibo en PDF. En el celular lo comparte directo a WhatsApp; en la computadora lo descarga y abre el chat. */
export default function BotonRecibo({ datos, compacto = false }: { datos: DatosRecibo; compacto?: boolean }) {
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");

  const mensaje = `Hola${datos.cliente.contacto ? " " + datos.cliente.contacto : ""}, le envío su recibo N.º ${datos.numero} por ${dinero(datos.monto)}. ¡Gracias por su pago!`;

  async function obtenerArchivo() {
    const blob = await crearPdf(datos);
    return new File([blob], datos.archivo, { type: "application/pdf" });
  }

  function descargar(archivo: File) {
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function enviar() {
    setOcupado(true);
    setAviso("");
    try {
      const archivo = await obtenerArchivo();
      if (navigator.canShare?.({ files: [archivo] })) {
        try {
          await navigator.share({ files: [archivo], text: mensaje, title: `Recibo N.º ${datos.numero}` });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return; // Cerró el menú de compartir
        }
      }
      // Computadora: se descarga el PDF y se abre el chat para arrastrarlo
      descargar(archivo);
      if (datos.cliente.whatsapp) {
        window.open(`https://wa.me/${datos.cliente.whatsapp}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
        setAviso("Se descargó el PDF. Arrástralo al chat de WhatsApp que se abrió.");
      } else {
        setAviso("Se descargó el PDF. El cliente no tiene celular guardado.");
      }
    } catch {
      setAviso("No se pudo crear el recibo. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  async function soloDescargar() {
    setOcupado(true);
    try {
      descargar(await obtenerArchivo());
    } catch {
      setAviso("No se pudo crear el recibo. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex gap-1">
        <button
          type="button"
          onClick={enviar}
          disabled={ocupado}
          className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          title="Enviar el recibo en PDF por WhatsApp"
        >
          {ocupado ? "Creando…" : compacto ? "Recibo" : "Enviar recibo"}
        </button>
        <button
          type="button"
          onClick={soloDescargar}
          disabled={ocupado}
          className="rounded-lg border px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          title="Descargar el recibo en PDF"
          aria-label={`Descargar recibo N.º ${datos.numero} en PDF`}
        >
          PDF
        </button>
      </span>
      {aviso && <span className="max-w-[16rem] text-right text-xs text-gray-600" role="status">{aviso}</span>}
    </span>
  );
}
