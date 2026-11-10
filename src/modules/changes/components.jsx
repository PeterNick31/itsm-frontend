import { Link } from "react-router-dom";
import { formatDateTime } from "../../services/changes.js";
import "./changes.css";

export const STATE_LABELS = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  PROGRAMADO: "Programado",
  IMPLEMENTADO: "Implementado",
};

export function ChangeStatus({ estado }) {
  return <span className={`status-badge change-status change-${estado}`}>{STATE_LABELS[estado] || estado}</span>;
}

export function RiskTag({ riesgo }) {
  return <span className={`risk-tag risk-${riesgo}`}>Riesgo {riesgo?.toLowerCase()}</span>;
}

export function ChangeRows({ items }) {
  if (!items.length) return <p className="empty-state">No hay cambios para mostrar con estos filtros.</p>;
  return (
    <div className="problem-list">
      {items.map((item) => (
        <Link className="problem-row" to={`/cambios/${encodeURIComponent(item.cambio_id)}`} key={item.cambio_id}>
          <span className={`risk-dot risk-dot-${item.riesgo}`} aria-label={`Riesgo ${item.riesgo}`} />
          <span className="problem-row-main">
            <strong>{item.titulo}</strong>
            <small>
              {item.cambio_id} · {item.tipo}
              {item.ventana_inicio ? ` · Ventana ${formatDateTime(item.ventana_inicio)}` : ""}
              {item.problema_id ? ` · ${item.problema_id}` : ""}
            </small>
          </span>
          <ChangeStatus estado={item.estado} />
          <span className="row-chevron" aria-hidden="true">›</span>
        </Link>
      ))}
    </div>
  );
}

export function NoAccess() {
  return (
    <div className="page-content">
      <div className="panel">
        <p className="eyebrow">GESTIÓN DE CAMBIOS</p>
        <h2>Sin acceso</h2>
        <p className="muted">El módulo de Cambios está disponible para los roles ADMIN y AGENTE.</p>
      </div>
    </div>
  );
}

export const canManageChanges = (user) => ["ADMIN", "AGENTE"].includes(user?.rol);
