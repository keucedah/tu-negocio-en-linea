// Tiendas de los clientes (tabla "tiendas").
// Todo aquí corre en el servidor con la clave de servicio.
import { servicioConfigurado } from "../config";
import { urlSitio } from "../url";
import { crearClienteServicio } from "../supabase/servicio";
import { limiteProductos } from "../negocio";
import { normalizarDominio, validarSlug } from "../slug";
import { COLOR_ENCABEZADO, COLOR_PRINCIPAL } from "../tema";
import type { Cliente, Plan, TiendaCliente, TipoNegocio } from "./types";

type Servicio = ReturnType<typeof crearClienteServicio>;

const COLUMNAS_TIPO = "id, nombre, color_principal, color_encabezado, titulo_portada, texto_portada, texto_buscador, categorias, orden, activo";

export async function enlaceTienda(slug: string): Promise<string> {
  return `${await urlSitio()}/${slug}`;
}

async function leerTipo(sb: Servicio, id: number | null): Promise<TipoNegocio | null> {
  if (!id) return null;
  const { data } = await sb.from("tipos_negocio").select(COLUMNAS_TIPO).eq("id", id).maybeSingle<TipoNegocio>();
  return data;
}

const categoriasDelTipo = (tipo: TipoNegocio | null) =>
  [...new Set((tipo?.categorias ?? "").split("\n").map((c) => c.trim().slice(0, 60)).filter(Boolean))];

const activa = (c: Pick<Cliente, "estado">) => c.estado === "prueba" || c.estado === "activo";

/** Datos que el panel controla en la tienda: plan, límite, dominio y si está activa. */
function datosControlados(cliente: Cliente, plan: Plan | undefined) {
  const dominio = cliente.con_dominio ? normalizarDominio(cliente.dominio) : "";
  return {
    activa: activa(cliente),
    nombre_plan: (plan?.nombre ?? (cliente.limite_personalizado ? "Especial" : "")).slice(0, 40),
    limite_productos: limiteProductos(cliente, plan) ?? 2000,
    dominio: dominio || null,
    tipo_negocio_id: cliente.tipo_negocio_id,
    tipo_negocio_otro: cliente.tipo_negocio_otro.slice(0, 60),
  };
}

/** Desde la 2.5 la tienda también lleva la dirección y el municipio de su cliente (para los mototaxis). */
const datos25 = (cliente: Cliente) => ({
  direccion: cliente.direccion.slice(0, 200),
  municipio_id: cliente.municipio_id ?? null,
  ofrece_mototaxi: cliente.ofrece_mototaxi,
});

/** Columna que todavía no existe porque falta el SQL de la 2.5. */
export const faltaColumna = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === "42703" || e.code === "PGRST204"));

const errorDominio = (m: string) =>
  m.includes("tiendas_dominio_key") ? "Ese dominio ya lo usa otra tienda." : m;

/**
 * Copia a su tienda el plan, el límite, el dominio, el estado y el tipo de negocio del cliente.
 * Si cambió el tipo y la tienda todavía tiene los colores del tipo anterior (o los de fábrica),
 * se le ponen los colores sugeridos del tipo nuevo. Los textos de portada vacíos ya siguen al tipo.
 */
export async function sincronizarTienda(cliente: Cliente, plan: Plan | undefined): Promise<string | null> {
  if (!cliente.tienda_id || !servicioConfigurado) return null;
  const sb = crearClienteServicio();
  const { data: actual } = await sb
    .from("tiendas")
    .select("tipo_negocio_id, color_principal, color_encabezado")
    .eq("id", cliente.tienda_id)
    .maybeSingle();
  const cambios: Record<string, unknown> = { ...datosControlados(cliente, plan), ...datos25(cliente), actualizado_en: new Date().toISOString() };
  if (actual && actual.tipo_negocio_id !== cliente.tipo_negocio_id) {
    const [anterior, nuevo] = await Promise.all([leerTipo(sb, actual.tipo_negocio_id), leerTipo(sb, cliente.tipo_negocio_id)]);
    const sinTocar =
      (actual.color_principal === (anterior?.color_principal ?? COLOR_PRINCIPAL) &&
        actual.color_encabezado === (anterior?.color_encabezado ?? COLOR_ENCABEZADO)) ||
      (actual.color_principal === COLOR_PRINCIPAL && actual.color_encabezado === COLOR_ENCABEZADO);
    if (nuevo && sinTocar) {
      cambios.color_principal = nuevo.color_principal;
      cambios.color_encabezado = nuevo.color_encabezado;
    }
  }
  let { error } = await sb.from("tiendas").update(cambios).eq("id", cliente.tienda_id);
  if (faltaColumna(error)) {
    delete cambios.direccion;
    delete cambios.municipio_id;
    delete cambios.ofrece_mototaxi;
    ({ error } = await sb.from("tiendas").update(cambios).eq("id", cliente.tienda_id));
  }
  return error ? "No se pudo actualizar su tienda: " + errorDominio(error.message) : null;
}

/** Suspende la tienda (sin borrar sus productos). */
export async function suspenderTienda(tiendaId: number | null): Promise<void> {
  if (!tiendaId || !servicioConfigurado) return;
  await crearClienteServicio().from("tiendas").update({ activa: false }).eq("id", tiendaId);
}

async function buscarUsuario(sb: Servicio, correo: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const u = data.users.find((x) => x.email?.toLowerCase() === correo);
    if (u) return u;
    if (data.users.length < 1000) return null;
  }
  return null;
}

/**
 * Crea la tienda del cliente, su usuario (correo + contraseña) y lo deja como dueño.
 * Si el correo ya tiene usuario, ese usuario pasa a ser dueño y su contraseña no cambia.
 */
export async function crearTienda(
  cliente: Cliente,
  plan: Plan | undefined,
  slug: string,
  correo: string,
  clave: string,
): Promise<{ ok: true; usuarioNuevo: boolean } | { ok: false; mensaje: string }> {
  if (!servicioConfigurado) return { ok: false, mensaje: "Falta la variable SUPABASE_SERVICE_ROLE_KEY en Vercel para crear tiendas." };
  if (cliente.tienda_id) return { ok: false, mensaje: "Este cliente ya tiene tienda." };
  const errSlug = validarSlug(slug);
  if (errSlug) return { ok: false, mensaje: errSlug };
  correo = correo.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { ok: false, mensaje: "Escribe un correo válido para el dueño de la tienda." };

  const sb = crearClienteServicio();
  const existente = await buscarUsuario(sb, correo);
  if (!existente && clave.length < 8) return { ok: false, mensaje: "La contraseña debe tener al menos 8 caracteres." };
  const tipo = await leerTipo(sb, cliente.tipo_negocio_id);

  const fila: Record<string, unknown> = {
    slug,
    nombre_tienda: cliente.negocio.slice(0, 60),
    codigo_pais: cliente.codigo_pais,
    celular: cliente.celular,
    // Diseño sugerido de su tipo de negocio; el dueño lo cambia luego en "Apariencia".
    color_principal: tipo?.color_principal ?? COLOR_PRINCIPAL,
    color_encabezado: tipo?.color_encabezado ?? COLOR_ENCABEZADO,
    ...datosControlados(cliente, plan),
    ...datos25(cliente),
  };
  let { data: tienda, error } = await sb.from("tiendas").insert(fila).select("id").single();
  if (faltaColumna(error)) {
    delete fila.direccion;
    delete fila.municipio_id;
    ({ data: tienda, error } = await sb.from("tiendas").insert(fila).select("id").single());
  }
  if (error) {
    if (error.code === "23505" && error.message.includes("slug")) return { ok: false, mensaje: `La dirección “${slug}” ya la usa otra tienda.` };
    return { ok: false, mensaje: "No se pudo crear la tienda: " + errorDominio(error.message) };
  }
  if (!tienda) return { ok: false, mensaje: "No se pudo crear la tienda." };

  let userId = existente?.id;
  if (!userId) {
    const { data, error: errUser } = await sb.auth.admin.createUser({ email: correo, password: clave, email_confirm: true });
    if (errUser || !data.user) {
      await sb.from("tiendas").delete().eq("id", tienda.id);
      return { ok: false, mensaje: "No se pudo crear el usuario: " + (errUser?.message ?? "error desconocido") };
    }
    userId = data.user.id;
  }

  await sb.from("tienda_admins").insert({ tienda_id: tienda.id, user_id: userId });
  const categorias = categoriasDelTipo(tipo);
  if (categorias.length) await sb.from("categorias").insert(categorias.map((nombre) => ({ tienda_id: tienda.id, nombre })));
  const { error: errCliente } = await sb
    .from("clientes")
    .update({ tienda_id: tienda.id, sitio_url: await enlaceTienda(slug), actualizado_en: new Date().toISOString() })
    .eq("id", cliente.id);
  if (errCliente) return { ok: false, mensaje: "La tienda se creó, pero no se pudo enlazar al cliente: " + errCliente.message };
  return { ok: true, usuarioNuevo: !existente };
}

/** Datos de la tienda del cliente para su ficha. */
export async function obtenerTiendaCliente(tiendaId: number | null): Promise<TiendaCliente | null> {
  if (!tiendaId || !servicioConfigurado) return null;
  const sb = crearClienteServicio();
  const [{ data: t }, { count }, { data: duenos }] = await Promise.all([
    sb.from("tiendas").select("id, slug, nombre_tienda, dominio, activa, limite_productos, nombre_plan").eq("id", tiendaId).maybeSingle(),
    sb.from("productos").select("id", { count: "exact", head: true }).eq("tienda_id", tiendaId),
    sb.from("tienda_admins").select("user_id").eq("tienda_id", tiendaId),
  ]);
  if (!t) return null;
  const correos = await Promise.all(
    (duenos ?? []).map(async (d) => (await sb.auth.admin.getUserById(d.user_id)).data.user?.email ?? ""),
  );
  return { ...t, productos: count ?? 0, duenos: correos.filter(Boolean), enlace: await enlaceTienda(t.slug) };
}

/** Cambia la contraseña del dueño (o de todos los dueños) de la tienda. */
export async function cambiarClaveDuenos(tiendaId: number, clave: string): Promise<string | null> {
  if (!servicioConfigurado) return "Falta la variable SUPABASE_SERVICE_ROLE_KEY en Vercel.";
  if (clave.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  const sb = crearClienteServicio();
  const { data: duenos } = await sb.from("tienda_admins").select("user_id").eq("tienda_id", tiendaId);
  if (!duenos?.length) return "Esta tienda no tiene dueño.";
  for (const d of duenos) {
    const { error } = await sb.auth.admin.updateUserById(d.user_id, { password: clave });
    if (error) return "No se pudo cambiar la contraseña: " + error.message;
  }
  return null;
}
