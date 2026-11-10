import { http } from "./api.js";
import { buildDemoChanges } from "../modules/changes/demoData.js";

// Cliente del microservicio itsm-cambios (VITE_API_CAMBIOS = URL base, sin /cambios).

const demoMode =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== "false");

export const CHANGE_STATES = ["BORRADOR", "PENDIENTE_APROBACION", "APROBADO", "RECHAZADO", "PROGRAMADO", "IMPLEMENTADO"];
export const CHANGE_TYPES = ["ESTANDAR", "NORMAL", "EMERGENCIA"];
export const CHANGE_RISKS = ["ALTO", "MEDIO", "BAJO"];

function baseUrl() {
  const url = import.meta.env.VITE_API_CAMBIOS;
  if (!url) throw new Error("Configura VITE_API_CAMBIOS para conectar el microservicio de Cambios.");
  return url.replace(/\/$/, "");
}

function changeUrl(id, action = "") {
  return `${baseUrl()}/cambios/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;
}

// ------------------------------------------------------------------ modo demo

function session() {
  return JSON.parse(localStorage.getItem("itsm-auth") || "null");
}

function demoTenant() {
  return session()?.user?.tenant_id || "acme";
}

function demoUserId() {
  const user = session()?.user || {};
  return user.usuario_id || user.sub || `usr-${demoTenant()}-00001`;
}

const storageKey = (tenantId) => `itsm-demo-changes-${tenantId}`;

function loadDemo() {
  const tenantId = demoTenant();
  const saved = JSON.parse(localStorage.getItem(storageKey(tenantId)) || "null");
  return saved || buildDemoChanges(tenantId);
}

function saveDemo(items) {
  localStorage.setItem(storageKey(demoTenant()), JSON.stringify(items));
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function demoError(status, mensaje) {
  const error = new Error(mensaje);
  error.response = { status, data: { error: { mensaje } } };
  return error;
}

const DEMO_TRANSITIONS = {
  enviar: { from: ["BORRADOR"], to: "PENDIENTE_APROBACION" },
  aprobar: { from: ["PENDIENTE_APROBACION"], to: "APROBADO", admin: true },
  rechazar: { from: ["PENDIENTE_APROBACION"], to: "RECHAZADO", admin: true },
  programar: { from: ["APROBADO", "PROGRAMADO"], to: "PROGRAMADO" },
  implementar: { from: ["PROGRAMADO"], to: "IMPLEMENTADO" },
};

function demoAction(id, action, body) {
  const items = loadDemo();
  const item = items.find((change) => change.cambio_id === id);
  if (!item) throw demoError(404, "No existe un cambio con ese ID en este tenant.");
  const rule = DEMO_TRANSITIONS[action];
  if (rule.admin && session()?.user?.rol !== "ADMIN") throw demoError(403, "Solo ADMIN puede aprobar o rechazar.");
  if (!rule.from.includes(item.estado)) throw demoError(409, `No se puede pasar de ${item.estado} a ${rule.to}.`);
  if (action === "enviar" && (!item.plan_implementacion || !item.plan_rollback)) {
    throw demoError(400, "Antes de enviar completa el plan de implementación y el de rollback.");
  }
  if (action === "rechazar" && !body?.motivo?.trim()) throw demoError(400, "motivo es obligatorio.");
  if (action === "programar") {
    if (!body?.ventana_inicio || !body?.ventana_fin || body.ventana_fin <= body.ventana_inicio) {
      throw demoError(400, "ventana_fin debe ser posterior a ventana_inicio.");
    }
    item.ventana_inicio = body.ventana_inicio;
    item.ventana_fin = body.ventana_fin;
  }
  if (action === "aprobar" || action === "rechazar") item.aprobador_id = demoUserId();
  if (action === "rechazar") item.motivo_rechazo = body.motivo.trim();
  if (action === "implementar") {
    item.implementado_en = nowIso();
    item.implementado_por = demoUserId();
    item.notas_implementacion = body?.notas_implementacion || "";
  }
  item.estado = rule.to;
  item.actualizado_en = nowIso();
  saveDemo(items);
  return { data: item };
}

// ------------------------------------------------------------------ API

export async function listChanges({ estado = "", tipo = "", riesgo = "", limite = 20, siguiente = null } = {}) {
  if (demoMode) {
    const items = loadDemo()
      .filter((item) => (!estado || item.estado === estado) && (!tipo || item.tipo === tipo) && (!riesgo || item.riesgo === riesgo))
      .sort((a, b) => b.cambio_id.localeCompare(a.cambio_id));
    const offset = siguiente ? Number(siguiente) : 0;
    const end = offset + limite;
    return { data: items.slice(offset, end), paginacion: { limite, siguiente: end < items.length ? String(end) : null } };
  }
  // Con filtros tipo/riesgo DynamoDB puede devolver páginas incompletas: se completa la página.
  const items = [];
  let cursor = siguiente;
  const seen = new Set(cursor ? [cursor] : []);
  while (items.length < limite) {
    const { data } = await http.get(`${baseUrl()}/cambios`, {
      params: {
        estado: estado || undefined,
        tipo: tipo || undefined,
        riesgo: riesgo || undefined,
        limite: limite - items.length,
        siguiente: cursor || undefined,
      },
    });
    if (!Array.isArray(data.data)) throw new Error("La respuesta de Cambios no contiene una lista válida.");
    items.push(...data.data);
    cursor = data.paginacion?.siguiente || null;
    if (!cursor) break;
    if (seen.has(cursor)) throw new Error("La API de Cambios repitió un cursor de paginación.");
    seen.add(cursor);
  }
  return { data: items, paginacion: { limite, siguiente: cursor } };
}

export async function getChange(id) {
  if (demoMode) {
    const item = loadDemo().find((change) => change.cambio_id === id);
    if (!item) throw demoError(404, "No existe un cambio con ese ID en este tenant.");
    return { data: item };
  }
  const { data } = await http.get(changeUrl(id));
  return data;
}

export async function createChange(values) {
  if (demoMode) {
    const tenantId = demoTenant();
    const now = nowIso();
    const item = {
      ...values,
      tenant_id: tenantId,
      cambio_id: `chg-${tenantId}-${Date.now().toString(16)}`,
      estado: "BORRADOR",
      solicitante_id: demoUserId(),
      aprobador_id: null,
      motivo_rechazo: null,
      problema_id: values.problema_id || null,
      solicitud_id: values.solicitud_id || null,
      creado_en: now,
      actualizado_en: now,
    };
    saveDemo([item, ...loadDemo()]);
    return { data: item };
  }
  const { data } = await http.post(`${baseUrl()}/cambios`, values);
  return data;
}

export async function updateChange(id, values) {
  if (demoMode) {
    const items = loadDemo();
    const item = items.find((change) => change.cambio_id === id);
    if (!item) throw demoError(404, "No existe un cambio con ese ID en este tenant.");
    if (!["BORRADOR", "PENDIENTE_APROBACION"].includes(item.estado)) {
      throw demoError(409, "Solo se edita en BORRADOR o PENDIENTE_APROBACION.");
    }
    Object.assign(item, values, { actualizado_en: nowIso() });
    saveDemo(items);
    return { data: item };
  }
  const { data } = await http.put(changeUrl(id), values);
  return data;
}

/** action: enviar | aprobar | rechazar | programar | implementar */
export async function runChangeAction(id, action, body = {}) {
  if (demoMode) return demoAction(id, action, body);
  const { data } = await http.post(changeUrl(id, action), body);
  return data;
}

/** Trae todos los cambios con ventana en [desde, hasta] (ISO). */
export async function getCalendar({ desde, hasta }) {
  if (demoMode) {
    const data = loadDemo()
      .filter((item) => item.ventana_inicio && item.ventana_inicio >= desde && item.ventana_inicio <= hasta)
      .sort((a, b) => a.ventana_inicio.localeCompare(b.ventana_inicio));
    return { data };
  }
  const items = [];
  let cursor = null;
  for (let page = 0; page < 10; page += 1) {
    const { data } = await http.get(`${baseUrl()}/cambios/calendario`, {
      params: { desde, hasta, limite: 100, siguiente: cursor || undefined },
    });
    items.push(...(data.data || []));
    cursor = data.paginacion?.siguiente || null;
    if (!cursor) break;
  }
  return { data: items, truncado: Boolean(cursor) };
}

export function toApiDate(localValue) {
  // <input type="datetime-local"> -> ISO 8601 UTC sin milisegundos
  return new Date(localValue).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function formatDateTime(isoValue) {
  if (!isoValue) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoValue));
}
