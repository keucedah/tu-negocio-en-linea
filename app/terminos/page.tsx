import type { Metadata } from "next";
import Link from "next/link";
import Legal, { Contacto } from "@/components/Legal";
import { obtenerAjustes } from "@/lib/panel/datos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Las reglas para usar Tu Negocio en Línea HN: tiendas en línea, compras por WhatsApp, mototaxistas, pagos y publicidad.",
  alternates: { canonical: "/terminos" },
};

export default async function Terminos() {
  const ajustes = await obtenerAjustes();
  const n = ajustes.nombre_negocio;
  return (
    <Legal ajustes={ajustes} titulo="Términos y condiciones">
      <p>
        Estos términos explican las reglas para usar {n} (“la plataforma”). Al usar el sitio, una tienda de la plataforma, su App o la App del
        mototaxista, aceptas estos términos y la <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>1. Qué es la plataforma</h2>
      <p>
        {n} da a los negocios un catálogo en línea (tienda web y, si lo contratan, una App Android) para mostrar sus productos y recibir
        pedidos por WhatsApp. También permite que los clientes pidan a un mototaxista de su municipio que recoja y lleve sus productos.
      </p>
      <p>
        <b>La plataforma no vende productos, no cobra los pedidos y no presta el servicio de transporte.</b> Cada compra es un acuerdo entre
        el cliente y la tienda, y cada viaje es un acuerdo entre el cliente y el mototaxista.
      </p>

      <h2>2. Para quien compra</h2>
      <ul>
        <li>Los precios, existencias, fotos y descripciones los publica cada tienda. Confirma precio, disponibilidad, forma de pago y entrega con la tienda por WhatsApp antes de pagar.</li>
        <li>Si pides con mototaxi, la tarifa del viaje la acuerdas directamente con el mototaxista.</li>
        <li>Cualquier reclamo sobre un producto, un pago o una entrega se resuelve con la tienda o con el mototaxista. Si crees que una tienda o un mototaxista actúa de mala fe, avísanos y lo revisamos.</li>
      </ul>

      <h2>3. Para los negocios con tienda</h2>
      <ul>
        <li><b>Pagos.</b> El servicio se paga por mes según el plan contratado, más la instalación y el dominio si aplican. Los precios vigentes están en la página principal o en el acuerdo con cada negocio.</li>
        <li><b>Falta de pago.</b> Si el pago se atrasa, la tienda puede quedar suspendida y mostrar “no disponible”. Los productos no se borran y la tienda vuelve al ponerse al día.</li>
        <li><b>Límite de productos.</b> Cada plan tiene un número máximo de productos. Para subir más, se cambia de plan o se pagan productos adicionales.</li>
        <li><b>Contenido.</b> El negocio es responsable de lo que publica: productos legales, precios correctos y fotos, logos y textos que le pertenezcan o que tenga permiso de usar.</li>
        <li><b>Acceso.</b> El negocio cuida su correo y contraseña. Lo que se haga con su acceso se considera hecho por el negocio.</li>
        <li><b>Cancelación.</b> El negocio puede cancelar cuando quiera, avisando por WhatsApp. Lo pagado no se devuelve, salvo que se acuerde otra cosa.</li>
        <li><b>Servicio de mototaxi.</b> Lo activa {n} para las tiendas que lo piden y que tienen mototaxistas en su municipio.</li>
      </ul>

      <h2>4. Para los mototaxistas</h2>
      <ul>
        <li>El mototaxista trabaja por su cuenta. No es empleado de {n} ni de las tiendas.</li>
        <li>Paga una mensualidad para salir en las tiendas de su municipio. Si no paga a tiempo, deja de salir hasta ponerse al día.</li>
        <li>Debe tener los permisos, licencia y documentos que exija la ley y su municipio, y es responsable de su vehículo, del viaje y de cuidar los productos que transporta.</li>
        <li>Debe marcarse <b>Ocupado</b> cuando no pueda atender pedidos y tratar a clientes y tiendas con respeto.</li>
        <li>Su enlace personal es privado. Si lo comparte o lo pierde, debe pedir uno nuevo.</li>
      </ul>

      <h2>5. Anuncios y publicidad</h2>
      <p>
        En las tiendas pueden salir anuncios de la plataforma y, en los planes que lo incluyen, publicidad de otros negocios. Nunca se muestra
        publicidad de un negocio del mismo tipo que la tienda. Quien contrata publicidad es responsable de lo que anuncia. {n} puede rechazar
        o quitar cualquier anuncio que sea engañoso, ofensivo o ilegal.
      </p>

      <h2>6. Lo que no está permitido</h2>
      <ul>
        <li>Publicar productos ilegales, robados, falsificados o peligrosos, o contenido ofensivo o engañoso.</li>
        <li>Usar la plataforma para estafar, enviar mensajes masivos no deseados o hacerse pasar por otra persona o negocio.</li>
        <li>Intentar entrar a paneles o datos ajenos, o dañar el funcionamiento del sitio.</li>
      </ul>
      <p>Si esto pasa, {n} puede ocultar el contenido, suspender o cancelar la cuenta sin devolver lo pagado.</p>

      <h2>7. Disponibilidad y responsabilidad</h2>
      <p>
        Trabajamos para que la plataforma esté disponible siempre, pero puede haber pausas por mantenimiento o fallas de internet o de los
        proveedores. {n} no responde por las ventas, pagos, entregas o viajes acordados entre clientes, tiendas y mototaxistas, ni por
        pérdidas causadas por esas pausas. Si una falla es nuestra, la corregimos lo antes posible.
      </p>

      <h2>8. Propiedad</h2>
      <p>
        El diseño, el código y la marca de {n} son nuestros. Los productos, fotos, logos y textos de cada tienda son de su dueño, que nos da
        permiso de mostrarlos en la plataforma, en su App y en buscadores mientras use el servicio.
      </p>

      <h2>9. Cambios y ley aplicable</h2>
      <p>
        Podemos cambiar estos términos; la versión vigente es la publicada aquí con su fecha, y los cambios importantes se avisan por WhatsApp
        a negocios y mototaxistas. Estos términos se rigen por las leyes de la República de Honduras.
      </p>

      <h2>10. Contacto</h2>
      <Contacto ajustes={ajustes} />
    </Legal>
  );
}
