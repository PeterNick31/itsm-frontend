import { http } from "./api.js";

// Cliente de la API de Incidentes en AWS. El tenant y el rol provienen del JWT.
export const INCIDENT_STATES = ["NUEVO", "ASIGNADO", "EN_PROGRESO", "RESUELTO", "CERRADO"];
export const INCIDENT_CATEGORIES = ["RED", "HARDWARE", "SOFTWARE", "ACCESOS", "CORREO", "OTROS"];
export const INCIDENT_IMPACTS = ["ALTO", "MEDIO", "BAJO"];
export const INCIDENT_URGENCIES = ["ALTA", "MEDIA", "BAJA"];

function baseUrl() {
  const url = import.meta.env.VITE_API_INCIDENTES;
  if (!url) throw new Error("Configura VITE_API_INCIDENTES con la URL base del microservicio de Incidentes.");
  return url.replace(/\/$/, "");
}

const incidentUrl = (id, action = "") =>
  `${baseUrl()}/incidentes/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;

/** Respeta la paginación real de DynamoDB; no inventa un total. */
export async function listIncidents({ estado = "", prioridad = "", asignado_a = "", limite = 20, siguiente = null } = {}) {
  const items = [];
  let cursor = siguiente;
  const seen = new Set(cursor ? [cursor] : []);
  while (items.length < limite) {
    const { data } = await http.get(`${baseUrl()}/incidentes`, {
      params: {
        estado: estado || undefined,
        prioridad: prioridad || undefined,
        asignado_a: asignado_a || undefined,
        limite: Math.min(100, limite - items.length),
        siguiente: cursor || undefined,
      },
    });
    if (!Array.isArray(data.data)) throw new Error("La API de Incidentes no devolvió una lista válida.");
    items.push(...data.data);
    const next = data.paginacion?.siguiente || null;
    if (next && seen.has(next)) throw new Error("La API de Incidentes repitió un cursor de paginación.");
    if (next) seen.add(next);
    cursor = next;
    if (!cursor) break;
  }
  return { data: items, paginacion: { limite, siguiente: cursor } };
}

export async function getIncident(id) {
  const { data } = await http.get(incidentUrl(id));
  return data;
}

export async function createIncident(values) {
  const { data } = await http.post(`${baseUrl()}/incidentes`, { ...values, adjuntos: values.adjuntos || [] });
  return data;
}

export async function updateIncident(id, values) {
  const { data } = await http.put(incidentUrl(id), values);
  return data;
}

export async function assignIncident(id, asignado_a) {
  const { data } = await http.patch(incidentUrl(id, "asignar"), { asignado_a });
  return data;
}

export async function changeIncidentState(id, estado) {
  const { data } = await http.patch(incidentUrl(id, "estado"), { estado });
  return data;
}

export async function escalateIncident(id, motivo) {
  const { data } = await http.post(incidentUrl(id, "escalar-problema"), motivo?.trim() ? { motivo: motivo.trim() } : {});
  return data;
}

export async function listIncidentComments(id, { limite = 100, siguiente = null } = {}) {
  const { data } = await http.get(incidentUrl(id, "comentarios"), {
    params: { limite: Math.min(limite, 100), siguiente: siguiente || undefined },
  });
  if (!Array.isArray(data.data)) throw new Error("La API de Comentarios no devolvió una lista válida.");
  return data;
}

export async function addIncidentComment(id, texto) {
  const { data } = await http.post(incidentUrl(id, "comentarios"), { texto });
  return data;
}

export async function deleteIncident(id) {
  const { data } = await http.delete(incidentUrl(id));
  return data;
}

export function incidentDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
