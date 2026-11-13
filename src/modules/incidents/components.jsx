import { Link } from "react-router-dom";
import { incidentDate } from "../../services/incidents.js";
import "./incidents.css";

export const INCIDENT_STATE_LABELS = {
  NUEVO: "Nuevo",
  ASIGNADO: "Asignado",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

export const INCIDENT_TRANSITIONS = {
  NUEVO: [], // PATCH /asignar asigna al agente y cambia NUEVO → ASIGNADO
  ASIGNADO: ["EN_PROGRESO"],
  EN_PROGRESO: ["RESUELTO"],
  RESUELTO: ["CERRADO", "EN_PROGRESO"],
  CERRADO: [],
};

export const canManageIncidents = (user) => ["ADMIN", "AGENTE"].includes(user?.rol);

export function IncidentStatus({ estado }) {
  return <span className={`status-badge incident-state incident-${estado}`}>
    {INCIDENT_STATE_LABELS[estado] || estado}
  </span>;
}

export function IncidentRows({ items }) {
  if (!items.length) return <p className="empty-state">No hay incidentes para estos filtros.</p>;
  return <div className="problem-list">
    {items.map((item) => (
      <Link key={item.incidente_id} className="problem-row" to={`/incidentes/${encodeURIComponent(item.incidente_id)}`}>
        <span className="priority-dot" data-priority={item.prioridad} aria-label={`Prioridad ${item.prioridad}`} />
        <span className="problem-row-main">
          <strong>{item.titulo}</strong>
          <small>{item.incidente_id} · {item.categoria} · {item.prioridad} · {incidentDate(item.creado_en)}</small>
        </span>
        <IncidentStatus estado={item.estado} />
        <span className="row-chevron" aria-hidden="true">›</span>
      </Link>
    ))}
  </div>;
}
