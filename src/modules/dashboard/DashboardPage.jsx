import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { getSummary, listProblems } from "../../services/problems.js";
import { listIncidents, INCIDENT_STATES } from "../../services/incidents.js";
import { listChanges } from "../../services/changes.js";
import { canManageChanges } from "../changes/components.jsx";
import { INCIDENT_STATE_LABELS } from "../incidents/components.jsx";

const PENDING_CHANGES = new Set(["BORRADOR", "PENDIENTE_APROBACION", "APROBADO", "PROGRAMADO"]);
const ACTIVE_INCIDENTS = new Set(["NUEVO", "ASIGNADO", "EN_PROGRESO"]);

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [incidentPage, setIncidentPage] = useState(null);
  const [changePage, setChangePage] = useState(null);
  const [error, setError] = useState("");
  const canSeeChanges = canManageChanges(user);

  useEffect(() => {
    let active = true;
    const loaders = [
      getSummary(),
      listProblems({ limite: 4 }),
      listIncidents({ limite: 100 }),
      ...(canSeeChanges ? [listChanges({ limite: 100 })] : []),
    ];
    Promise.allSettled(loaders).then((results) => {
      if (!active) return;
      const failures = [];
      function take(index, label, update, value) {
        const result = results[index];
        if (result.status === "fulfilled") update(value(result.value));
        else failures.push(`${label}: ${apiErrorMessage(result.reason)}`);
      }
      take(0, "Problemas", setSummary, (r) => r.data);
      take(1, "Problemas recientes", setRecent, (r) => r.data);
      take(2, "Incidentes", setIncidentPage, (r) => r);
      if (canSeeChanges) take(3, "Cambios", setChangePage, (r) => r);
      setError(failures.join(" | "));
    });
    return () => { active = false; };
  }, [canSeeChanges]);

  const incidentCounts = useMemo(() => {
    const counts = Object.fromEntries(INCIDENT_STATES.map((state) => [state, 0]));
    (incidentPage?.data || []).forEach((item) => {
      if (Object.hasOwn(counts, item.estado)) counts[item.estado] += 1;
    });
    return counts;
  }, [incidentPage]);

  const activeIncidents = (incidentPage?.data || []).filter((item) => ACTIVE_INCIDENTS.has(item.estado)).length;
  const pendingChanges = (changePage?.data || []).filter((item) => PENDING_CHANGES.has(item.estado)).length;
  const incidentTruncated = Boolean(incidentPage?.paginacion?.siguiente);
  const changesTruncated = Boolean(changePage?.paginacion?.siguiente);
  const incidentNumber = incidentPage ? `${incidentTruncated ? "≥" : ""}${activeIncidents}` : "—";
  const changesNumber = canSeeChanges && changePage ? `${changesTruncated ? "≥" : ""}${pendingChanges}` : "—";

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">VISTA GENERAL</p>
          <h1>Hola, {user?.nombre?.split(" ")[0] || "equipo"}</h1>
          <p className="muted">Resumen de los tickets ITSM de tu organización.</p>
        </div>
        <span className="date-chip">{new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(new Date())}</span>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <section className="stat-grid" aria-label="Resumen de servicios ITSM">
        <StatCard label="Problemas abiertos" value={summary ? (summary.por_estado?.NUEVO || 0) + (summary.por_estado?.EN_ANALISIS || 0) + (summary.por_estado?.ERROR_CONOCIDO || 0) : "—"} note="Requieren seguimiento" tone="blue" />
        <StatCard label="En análisis" value={summary?.por_estado?.EN_ANALISIS ?? "—"} note="Investigación activa" tone="violet" />
        <StatCard label="Errores conocidos" value={summary?.por_estado?.ERROR_CONOCIDO ?? "—"} note="Con workaround registrado" tone="amber" />
        <StatCard label="Total problemas" value={summary?.total ?? "—"} note="Registrados en este tenant" tone="green" />
        <StatCard label="Incidentes activos" value={incidentNumber}
          note={incidentPage ? (incidentTruncated ? `En los ${incidentPage.data.length} más recientes; mínimo observado` : "Total del tenant") : "Consultando Incidentes"}
          tone="blue" />
        <StatCard label="Cambios pendientes" value={changesNumber}
          note={!canSeeChanges ? "No disponible para tu rol" : changePage ? (changesTruncated ? `En los ${changePage.data.length} más recientes; mínimo observado` : "Sin implementar, rechazar ni cerrar") : "Consultando Cambios"}
          tone="amber" />
      </section>
      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">ESTADO DE OPERACIÓN</p><h2>Incidentes por estado</h2></div>
          <Link className="text-link" to="/incidentes">Ver incidentes →</Link>
        </div>
        <div className="incident-state-grid">
          {INCIDENT_STATES.map((state) => <div className="incident-state-count" key={state}>
            <span>{INCIDENT_STATE_LABELS[state]}</span>
            <strong>{incidentPage ? `${incidentTruncated ? "≥" : ""}${incidentCounts[state]}` : "—"}</strong>
          </div>)}
        </div>
        <p className="list-footnote">
          {incidentPage
            ? incidentTruncated
              ? `Distribución de los ${incidentPage.data.length} registros más recientes. El símbolo ≥ expresa un mínimo observado, no un total global.`
              : `Distribución completa de los ${incidentPage.data.length} incidentes visibles para tu rol en este tenant.`
            : "Cargando datos de Incidentes."}
        </p>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">SEGUIMIENTO</p><h2>Problemas recientes</h2></div>
          <Link className="text-link" to="/problemas">Ver todos <span aria-hidden="true">→</span></Link>
        </div>
        <ProblemRows items={recent} />
      </section>
    </div>
  );
}

function StatCard({ label, value, note, tone }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`} aria-hidden="true">{label.charAt(0)}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-note">{note}</p>
    </article>
  );
}

export function ProblemRows({ items }) {
  if (!items.length) return <p className="empty-state">Todavía no hay problemas para mostrar.</p>;
  return (
    <div className="problem-list">
      {items.map((item) => (
        <Link className="problem-row" to={`/problemas/${encodeURIComponent(item.problema_id)}`} key={item.problema_id}>
          <span className="priority-dot" data-priority={item.prioridad} aria-label={`Prioridad ${item.prioridad}`} />
          <span className="problem-row-main">
            <strong>{item.titulo}</strong>
            <small>{item.problema_id} · {item.incidentes_ids?.length || 0} incidentes vinculados</small>
          </span>
          <span className={`status-badge status-${item.estado}`}>{item.estado.replaceAll("_", " ")}</span>
          <span className="row-chevron" aria-hidden="true">›</span>
        </Link>
      ))}
    </div>
  );
}
