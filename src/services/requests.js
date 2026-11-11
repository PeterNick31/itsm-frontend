import { http } from "./api.js";
import { buildDemoCatalog, buildDemoRequests } from "../modules/requests/demoData.js";

// Cliente del microservicio itsm-solicitudes (VITE_API_SOLICITUDES = URL base, sin /solicitudes).
// Flujo de estados (contrato v1.1): EN_APROBACION -> APROBADA -> COMPLETADA
//                                   EN_APROBACION -> RECHAZADA | CANCELADA

const demoMode =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== "false");

export const REQUEST_STATES = ["EN_APROBACION", "APROBADA", "COMPLETADA", "RECHAZADA", "CANCELADA"];

function baseUrl() {
  const url = import.meta.env.VITE_API_SOLICITUDES;
  if (!url) throw new Error("Configura VITE_API_SOLICITUDES para conectar el microservicio de Solicitudes.");
  return url.replace(/\/$/, "");
}

const requestUrl = (id, action = "") =>
  `${baseUrl()}/solicitudes/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

// ------------------------------------------------------------------ modo demo

const session = () => JSON.parse(localStorage.getItem("itsm-auth") || "null");
const demoTenant = () => session()?.user?.tenant_id || "acme";
const demoUserId = () => {
  const user = session()?.user || {};
  return user.usuario_id || user.sub || `usr-${demoTenant()}-00001`;
};
const nowIso = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const reqKey = (tenantId) => `itsm-demo-solicitudes-${tenantId}`;
const catKey = (tenantId) => `itsm-demo-catalogo-${tenantId}`;

function loadRequests() {
  const tenantId = demoTenant();
  return JSON.parse(localStorage.getItem(reqKey(tenantId)) || "null") || buildDemoRequests(tenantId);
}
const saveRequests = (items) => localStorage.setItem(reqKey(demoTenant()), JSON.stringify(items));

function loadCatalog() {
  const tenantId = demoTenant();
  return JSON.parse(localStorage.getItem(catKey(tenantId)) || "null") || buildDemoCatalog(tenantId);
}
const saveCatalog = (items) => localStorage.setItem(catKey(demoTenant()), JSON.stringify(items));

function demoError(status, mensaje) {
  const error = new Error(mensaje);
  error.response = { status, data: { error: { mensaje } } };
  return error;
}

// El SOLICITANTE solo ve y lista las suyas (igual que la API).
function visibleRequests() {
  const user = session()?.user || {};
  const all = loadRequests();
  return user.rol === "SOLICITANTE" ? all.filter((item) => item.solicitante_id === demoUserId()) : all;
}

function paginate(items, limite, siguiente) {
  const offset = siguiente ? Number(siguiente) : 0;
  if (!Number.isInteger(offset) || offset < 0) throw new Error("Cursor de demostración inválido.");
  const end = offset + limite;
  return { data: items.slice(offset, end), paginacion: { limite, siguiente: end < items.length ? String(end) : null } };
}

const DEMO_ACTIONS = {
  aprobar: { from: ["EN_APROBACION"], to: "APROBADA", roles: ["ADMIN"], deny: "Solo ADMIN puede aprobar solicitudes." },
  rechazar: { from: ["EN_APROBACION"], to: "RECHAZADA", roles: ["ADMIN"], deny: "Solo ADMIN puede rechazar solicitudes." },
  completar: { from: ["APROBADA"], to: "COMPLETADA", roles: ["ADMIN", "AGENTE"], deny: "Solo ADMIN o AGENTE pueden completar solicitudes." },
};

function demoAction(id, action, body) {
  const items = loadRequests();
  const item = items.find((request) => request.solicitud_id === id);
  if (!item) throw demoError(404, `Solicitud ${id} no existe`);
  const user = session()?.user || {};
  const rule = DEMO_ACTIONS[action];
  if (!rule.roles.includes(user.rol)) throw demoError(403, rule.deny);
  if (!rule.from.includes(item.estado)) throw demoError(409, `Estado '${item.estado}' no permite ${action}`);
  if (action === "rechazar" && !body?.motivo?.trim()) throw demoError(400, "Campo requerido: motivo");
  if (action === "aprobar") item.aprobador_id = demoUserId();
  if (action === "rechazar") item.motivo_rechazo = body.motivo.trim();
  setState(item, rule.to);
  saveRequests(items);
  return { data: item };
}

function setState(item, estado) {
  const now = nowIso();
  item.estado = estado;
  item.actualizado_en = now;
  item.estado_creado = `${estado}#${item.creado_en}`;
}

// ------------------------------------------------------------------ catálogo

export async function listCatalog({ limite = 100, siguiente = null } = {}) {
  if (demoMode) return paginate(loadCatalog(), limite, siguiente);
  const items = [];
  let cursor = siguiente;
  const seen = new Set(cursor ? [cursor] : []);
  do {
    const { data } = await http.get(`${baseUrl()}/catalogo`, {
      params: { limite: Math.min(limite, 100), siguiente: cursor || undefined },
    });
    if (!Array.isArray(data.data)) throw new Error("La respuesta del catálogo no contiene una lista válida.");
    items.push(...data.data);
    cursor = data.paginacion?.siguiente || null;
    if (cursor && seen.has(cursor)) throw new Error("La API del catálogo repitió un cursor de paginación.");
    if (cursor) seen.add(cursor);
  } while (cursor && items.length < limite);
  return { data: items, paginacion: { limite, siguiente: cursor } };
}

export async function createService(values) {
  if (demoMode) {
    if (session()?.user?.rol !== "ADMIN") throw demoError(403, "Sólo ADMIN puede crear servicios del catálogo");
    const tenantId = demoTenant();
    const item = { ...values, tenant_id: tenantId, servicio_id: `srv-${tenantId}-${Date.now().toString(36)}` };
    saveCatalog([...loadCatalog(), item]);
    return { data: item };
  }
  const { data } = await http.post(`${baseUrl()}/catalogo`, values);
  return data;
}

export async function updateService(id, values) {
  if (demoMode) {
    if (session()?.user?.rol !== "ADMIN") throw demoError(403, "Sólo ADMIN puede editar servicios del catálogo");
    const items = loadCatalog();
    const item = items.find((service) => service.servicio_id === id);
    if (!item) throw demoError(404, `Servicio ${id} no existe`);
    Object.assign(item, values);
    saveCatalog(items);
    return { data: item };
  }
  const { data } = await http.put(`${baseUrl()}/catalogo/${encodeURIComponent(id)}`, values);
  return data;
}

// ------------------------------------------------------------------ solicitudes

/**
 * Lista paginada. Con filtros la API puede devolver páginas incompletas
 * (FilterExpression + Limit en DynamoDB), así que se completa la página.
 */
export async function listRequests({ estado = "", solicitante_id = "", limite = 20, siguiente = null } = {}) {
  if (demoMode) {
    const items = visibleRequests()
      .filter((item) => (!estado || item.estado === estado) && (!solicitante_id || item.solicitante_id === solicitante_id))
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
    return paginate(items, limite, siguiente);
  }
  const items = [];
  let cursor = siguiente;
  const seen = new Set(cursor ? [cursor] : []);
  while (items.length < limite) {
    const { data } = await http.get(`${baseUrl()}/solicitudes`, {
      params: {
        estado: estado || undefined,
        solicitante_id: solicitante_id || undefined,
        limite: limite - items.length,
        siguiente: cursor || undefined,
      },
    });
    if (!Array.isArray(data.data)) throw new Error("La respuesta de Solicitudes no contiene una lista válida.");
    items.push(...data.data);
    cursor = data.paginacion?.siguiente || null;
    if (!cursor) break;
    if (seen.has(cursor)) throw new Error("La API de Solicitudes repitió un cursor de paginación.");
    seen.add(cursor);
  }
  return { data: items, paginacion: { limite, siguiente: cursor } };
}

export async function getRequest(id) {
  if (demoMode) {
    const item = visibleRequests().find((request) => request.solicitud_id === id);
    if (!item) throw demoError(404, `Solicitud ${id} no existe`);
    return { data: item };
  }
  const { data } = await http.get(requestUrl(id));
  return data;
}

export async function createRequest({ servicio_id, datos_formulario }) {
  if (demoMode) {
    const service = loadCatalog().find((item) => item.servicio_id === servicio_id);
    if (!service) throw demoError(404, `Servicio ${servicio_id} no existe`);
    if (service.activo === false) throw demoError(400, "El servicio está inactivo");
    const tenantId = demoTenant();
    const now = nowIso();
    const estado = service.requiere_aprobacion ? "EN_APROBACION" : "APROBADA";
    const item = {
      tenant_id: tenantId,
      solicitud_id: `req-${tenantId}-${Date.now()}`,
      servicio_id,
      solicitante_id: demoUserId(),
      estado,
      datos_formulario: datos_formulario || {},
      cambio_id: null,
      creado_en: now,
      actualizado_en: now,
      estado_creado: `${estado}#${now}`,
    };
    saveRequests([item, ...loadRequests()]);
    return { data: item };
  }
  const { data } = await http.post(`${baseUrl()}/solicitudes`, { servicio_id, datos_formulario });
  return data;
}

/** action: aprobar | rechazar | completar */
export async function runRequestAction(id, action, body = {}) {
  if (demoMode) return demoAction(id, action, body);
  const { data } = await http.post(requestUrl(id, action), body);
  return data;
}

export async function cancelRequest(id) {
  if (demoMode) {
    const items = loadRequests();
    const item = items.find((request) => request.solicitud_id === id);
    if (!item) throw demoError(404, `Solicitud ${id} no existe`);
    const user = session()?.user || {};
    if (user.rol !== "ADMIN" && item.solicitante_id !== demoUserId()) {
      throw demoError(403, "No puede cancelar solicitudes de otro usuario");
    }
    if (item.estado !== "EN_APROBACION") throw demoError(409, `Estado '${item.estado}' no permite cancelar`);
    setState(item, "CANCELADA");
    saveRequests(items);
    return { data: item };
  }
  const { data } = await http.delete(requestUrl(id));
  return data;
}

export function formatDateTime(isoValue) {
  if (!isoValue) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoValue));
}
