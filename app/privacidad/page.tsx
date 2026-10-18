import type { Metadata } from "next";
import Link from "next/link";
import Legal, { Contacto } from "@/components/Legal";
import { obtenerAjustes } from "@/lib/panel/datos";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos usa Tu Negocio en Línea HN, para qué, con quién se comparten y cómo pedir que se corrijan o se borren.",
  alternates: { canonical: "/privacidad" },
};

export default async function Privacidad() {
  const ajustes = await obtenerAjustes();
  const n = ajustes.nombre_negocio;
  return (
    <Legal ajustes={ajustes} titulo="Política de privacidad">
      <p>
        En {n} cuidamos los datos de las personas que usan la plataforma: los negocios que tienen su tienda en línea, las personas que compran en
        esas tiendas y los mototaxistas que ofrecen sus servicios. Aquí explicamos qué datos usamos, para qué y qué puedes pedirnos.
      </p>

      <h2>1. Quién es el responsable</h2>
      <p>El responsable de los datos de la plataforma es:</p>
      <Contacto ajustes={ajustes} />
      <p>
        Cada tienda es de su dueño. Lo que tú le escribes a una tienda por WhatsApp lo recibe y lo maneja ese negocio, no {n}.
      </p>

      <h2>2. Qué datos usamos</h2>
      <h3>Si compras en una tienda</h3>
      <ul>
        <li><b>No necesitas cuenta.</b> No te pedimos correo ni contraseña.</li>
        <li>Tu <b>carrito</b> se guarda solo en tu propio teléfono o computadora, para que no lo pierdas si cierras la página.</li>
        <li>
          Al enviar tu pedido, el mensaje (productos, tu nombre, dirección y comentario si los escribes) sale <b>directo por WhatsApp</b> a la tienda
          o al mototaxista que elegiste. Nosotros no recibimos ni guardamos ese mensaje.
        </li>
        <li>Solo contamos cuántas veces eligen a cada mototaxista y cuántas veces se ve o se toca un anuncio, sin saber quién fue.</li>
      </ul>
      <h3>Si pides una demostración</h3>
      <p>Tu nombre, el nombre de tu negocio, tu celular y tu mensaje, para responderte por WhatsApp.</p>
      <h3>Si tienes una tienda en la plataforma</h3>
      <ul>
        <li>Datos del negocio y del contacto: nombre, celular, correo, dirección y municipio.</li>
        <li>El correo y la contraseña para entrar a tu panel. La contraseña se guarda cifrada: nadie puede leerla, ni nosotros.</li>
        <li>Tu plan, tus pagos y tus recibos.</li>
        <li>Lo que publicas en tu tienda: logo, banners, productos, fotos, precios y textos. Esto es público para que tus clientes lo vean.</li>
      </ul>
      <h3>Si eres mototaxista</h3>
      <ul>
        <li>Nombre, celular, número de identidad, dirección, municipio, número de mototaxi, tu foto y la de tu mototaxi, y tus pagos.</li>
        <li>
          Con tu permiso, los clientes de las tiendas de tu municipio ven tu foto, nombre, código, celular, número y foto de tu mototaxi, y si
          estás disponible u ocupado. <b>Tu número de identidad nunca se publica.</b>
        </li>
      </ul>
      <h3>Datos técnicos</h3>
      <p>
        Como cualquier sitio web, el servidor registra datos técnicos de cada visita (dirección IP, navegador, página) por seguridad y para
        corregir fallas. Usamos cookies solo para mantener la sesión de quienes entran a un panel. No usamos cookies de publicidad ni
        herramientas que te sigan por otros sitios.
      </p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Dar el servicio: mostrar las tiendas, sus productos y los mototaxistas disponibles.</li>
        <li>Atender solicitudes, dar soporte y avisar de cambios en el servicio.</li>
        <li>Cobrar las mensualidades, enviar recordatorios y recibos por WhatsApp.</li>
        <li>Mantener la plataforma segura y funcionando.</li>
      </ul>
      <p><b>No vendemos ni alquilamos tus datos.</b> No los usamos para publicidad de otras empresas.</p>

      <h2>4. Con quién se comparten</h2>
      <ul>
        <li><b>Proveedores que hacen funcionar la plataforma:</b> Supabase (base de datos y fotos) y Vercel (el sitio web). Guardan los datos por nosotros y no pueden usarlos para otra cosa.</li>
        <li><b>WhatsApp (Meta):</b> cuando tú decides enviar un mensaje, se rige por las reglas de WhatsApp.</li>
        <li><b>Google y otros buscadores:</b> solo ven lo que es público en las tiendas (nombre, productos, precios, fotos).</li>
        <li><b>Autoridades:</b> solo si una ley o una orden judicial lo exige.</li>
      </ul>

      <h2>5. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>Los datos de una tienda o de un mototaxista, mientras use el servicio. Si lo deja, los guardamos hasta un año por si vuelve y luego se borran. Si pide que se borren antes, lo hacemos.</li>
        <li>Los pagos y recibos, el tiempo que pidan las leyes de Honduras para registros de cobro.</li>
        <li>Las solicitudes de demostración, hasta un año.</li>
      </ul>

      <h2>6. Lo que puedes pedirnos</h2>
      <p>
        Puedes pedir <b>ver</b> los datos que tenemos de ti, <b>corregirlos</b>, <b>borrarlos</b> o que <b>dejemos de publicarlos</b>
        (por ejemplo, un mototaxista que ya no quiere salir en las tiendas). Escríbenos por WhatsApp o por correo y te respondemos en un plazo
        máximo de 15 días. Para cuidar tus datos, podemos pedirte que confirmes que eres tú.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Las conexiones van cifradas (https), las contraseñas se guardan cifradas y cada persona solo puede ver y cambiar lo suyo: un dueño solo
        su tienda y un mototaxista solo sus datos. El enlace personal de cada mototaxista es privado; si se pierde, se cambia por uno nuevo.
      </p>

      <h2>8. Menores de edad</h2>
      <p>Las cuentas de tienda y de mototaxista son solo para mayores de 18 años.</p>

      <h2>9. Cambios a esta política</h2>
      <p>
        Si cambiamos esta política, publicaremos aquí la nueva versión con su fecha. Si el cambio es importante, avisaremos por WhatsApp a los
        negocios y mototaxistas.
      </p>
      <p>
        Lee también los <Link href="/terminos">Términos y condiciones</Link>.
      </p>
    </Legal>
  );
}
