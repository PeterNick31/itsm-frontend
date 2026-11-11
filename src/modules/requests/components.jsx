import { Link } from "react-router-dom";
import { formatDateTime } from "../../services/requests.js";
import "./requests.css";

export const STATE_LABELS = {
  EN_APROBACION: "En aprobación",
  APROBADA: "Aprobada",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

export const CATEGORY_LABELS = {
  ACCESOS: "Accesos",
  SOFTWARE: "Software",
  HARDWARE: "Hardware",
  APLICACIONES: "Aplicaciones",
  DATOS: "Datos",
  TELEFONIA: "Telefonía",
  SEGURIDAD: "Seguridad",
};

// Id del usuario de la sesión (el login real lo devuelve como usuario_id; en demo se simula).
export const currentUserId = (user) => user?.usuario_id || user?.sub || `usr-${user?.tenant_id}-00001`;
export const canManageRequests = (user) => ["ADMIN", "AGENTE"].includes(user?.rol);

export function RequestStatus({ estado }) {
  return <span className={`status-badge request-status request-${estado}`}>{STATE_LABELS[estado] || estado}</span>;
}

export function serviceName(catalog, servicioId) {
  return catalog[servicioId]?.nombre || servicioId;
}

export function RequestRows({ items, catalog }) {
  if (!items.length) return <p className="empty-state">No hay solicitudes con estos filtros. Crea una nueva desde el botón superior.</p>;
  return (
    <div className="problem-list">
      {items.map((item) => (
        <Link className="problem-row" to={`/solicitudes/${encodeURIComponent(item.solicitud_id)}`} key={item.solicitud_id}>
          <span className={`request-dot request-dot-${item.estado}`} aria-hidden="true" />
          <span className="problem-row-main">
            <strong>{serviceName(catalog, item.servicio_id)}</strong>
            <small>
              {item.solicitud_id} · Solicitante {item.solicitante_id} · {formatDateTime(item.creado_en)}
            </small>
          </span>
          <RequestStatus estado={item.estado} />
          <span className="row-chevron" aria-hidden="true">›</span>
        </Link>
      ))}
    </div>
  );
}
