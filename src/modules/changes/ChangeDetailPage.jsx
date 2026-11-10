import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import {
  CHANGE_RISKS,
  CHANGE_TYPES,
  formatDateTime,
  getChange,
  runChangeAction,
  toApiDate,
  updateChange,
} from "../../services/changes.js";
import { canManageChanges, ChangeStatus, NoAccess, RiskTag } from "./components.jsx";

const FLOW = ["BORRADOR", "PENDIENTE_APROBACION", "APROBADO", "PROGRAMADO", "IMPLEMENTADO"];
const FLOW_LABELS = ["Borrador", "Aprobación", "Aprobado", "Programado", "Implementado"];

function toLocalInput(isoValue) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ChangeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [change, setChange] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(null); // editar | rechazar | programar | implementar
  const [form, setForm] = useState({});

  async function refresh() {
    const result = await getChange(id);
    setChange(result.data);
  }

  useEffect(() => {
    if (!canManageChanges(user)) return;
    refresh().catch((reason) => setError(apiErrorMessage(reason)));
  }, [id]);

  if (!canManageChanges(user)) return <NoAccess />;

  const isAdmin = user.rol === "ADMIN";

  function open(name) {
    if (panel === name) {
      setPanel(null);
      return;
    }
    setError("");
    if (name === "editar") {
      setForm({
        titulo: change.titulo,
        descripcion: change.descripcion || "",
        tipo: change.tipo,
        riesgo: change.riesgo,
        plan_implementacion: change.plan_implementacion || "",
        plan_rollback: change.plan_rollback || "",
      });
    } else if (name === "programar") {
      setForm({ inicio: toLocalInput(change.ventana_inicio), fin: toLocalInput(change.ventana_fin) });
    } else {
      setForm({ motivo: "", notas_implementacion: "" });
    }
    setPanel(name);
  }

  async function perform(task) {
    setBusy(true);
    setError("");
    try {
      const result = await task();
      setChange(result.data);
      setPanel(null);
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const act = (action, body) => perform(() => runChangeAction(id, action, body));

  function submitPanel(event) {
    event.preventDefault();
    if (panel === "editar") return perform(() => updateChange(id, form));
    if (panel === "rechazar") return act("rechazar", { motivo: form.motivo });
    if (panel === "implementar") return act("implementar", { notas_implementacion: form.notas_implementacion });
    if (panel === "programar") {
      if (!form.inicio || !form.fin) {
        setError("Indica el inicio y el fin de la ventana.");
        return undefined;
      }
      return act("programar", { ventana_inicio: toApiDate(form.inicio), ventana_fin: toApiDate(form.fin) });
    }
    return undefined;
  }

  const field = (name) => ({ value: form[name] ?? "", onChange: (event) => setForm({ ...form, [name]: event.target.value }) });

  if (!change && !error) return <div className="page-content"><p className="muted">Cargando cambio…</p></div>;

  const estado = change?.estado;
  const editable = ["BORRADOR", "PENDIENTE_APROBACION"].includes(estado);
  const stepIndex = FLOW.indexOf(estado);

  return (
    <div className="page-content">
      <p className="breadcrumb"><Link to="/cambios">Cambios</Link> / Detalle</p>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          {!change && <button className="alert-dismiss" onClick={() => navigate("/cambios")}>Volver</button>}
        </div>
      )}
      {change && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{change.cambio_id} · {change.tipo}</p>
              <h1>{change.titulo}</h1>
              <p className="muted">{change.descripcion || "Sin descripción."}</p>
            </div>
            <div className="detail-actions">
              {editable && <button className="button button-secondary" onClick={() => open("editar")}>{panel === "editar" ? "Cancelar edición" : "Editar"}</button>}
              {estado === "BORRADOR" && <button className="button button-primary" disabled={busy} onClick={() => act("enviar")}>Enviar a aprobación</button>}
              {estado === "PENDIENTE_APROBACION" && isAdmin && (
                <>
                  <button className="button button-danger" onClick={() => open("rechazar")}>Rechazar</button>
                  <button className="button button-primary" disabled={busy} onClick={() => act("aprobar")}>Aprobar</button>
                </>
              )}
              {estado === "APROBADO" && <button className="button button-primary" onClick={() => open("programar")}>Programar ventana</button>}
              {estado === "PROGRAMADO" && (
                <>
                  <button className="button button-secondary" onClick={() => open("programar")}>Reprogramar</button>
                  <button className="button button-primary" onClick={() => open("implementar")}>Marcar implementado</button>
                </>
              )}
            </div>
          </div>

          {estado === "PENDIENTE_APROBACION" && !isAdmin && (
            <div className="alert alert-info">Este cambio espera la aprobación de un usuario ADMIN.</div>
          )}

          {panel && (
            <form className="panel form-grid change-form" onSubmit={submitPanel}>
              {panel === "editar" && (
                <>
                  <div className="section-heading form-full"><div><p className="eyebrow">EDICIÓN</p><h2>Editar solicitud de cambio</h2></div></div>
                  <label className="form-full">Título<input required maxLength={200} {...field("titulo")} /></label>
                  <label className="form-full">Descripción<textarea rows="2" {...field("descripcion")} /></label>
                  <label>Tipo<select {...field("tipo")}>{CHANGE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label>Riesgo<select {...field("riesgo")}>{CHANGE_RISKS.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label className="form-full">Plan de implementación<textarea rows="3" {...field("plan_implementacion")} /></label>
                  <label className="form-full">Plan de rollback<textarea rows="3" {...field("plan_rollback")} /></label>
                </>
              )}
              {panel === "rechazar" && (
                <>
                  <div className="section-heading form-full"><div><p className="eyebrow">APROBACIÓN</p><h2>Rechazar cambio</h2></div></div>
                  <label className="form-full">Motivo del rechazo<textarea required rows="3" maxLength={1000} {...field("motivo")} /></label>
                </>
              )}
              {panel === "programar" && (
                <>
                  <div className="section-heading form-full"><div><p className="eyebrow">VENTANA DE MANTENIMIENTO</p><h2>Programar implementación</h2></div></div>
                  <label>Inicio<input type="datetime-local" required {...field("inicio")} /></label>
                  <label>Fin<input type="datetime-local" required min={form.inicio} {...field("fin")} /></label>
                </>
              )}
              {panel === "implementar" && (
                <>
                  <div className="section-heading form-full"><div><p className="eyebrow">CIERRE TÉCNICO</p><h2>Registrar implementación</h2></div></div>
                  <label className="form-full">Notas de implementación (opcional)<textarea rows="3" maxLength={2000} {...field("notas_implementacion")} /></label>
                </>
              )}
              <div className="form-actions form-full">
                <button type="button" className="button button-secondary" onClick={() => setPanel(null)}>Cancelar</button>
                <button className={`button ${panel === "rechazar" ? "button-danger" : "button-primary"}`} disabled={busy}>
                  {busy ? "Guardando…" : { editar: "Guardar cambios", rechazar: "Confirmar rechazo", programar: "Guardar ventana", implementar: "Confirmar implementación" }[panel]}
                </button>
              </div>
            </form>
          )}

          <section className="panel change-flow" aria-label="Ciclo de vida del cambio">
            {estado === "RECHAZADO" ? (
              <p className="flow-rejected">Este cambio fue <strong>rechazado</strong>{change.motivo_rechazo ? `: ${change.motivo_rechazo}` : "."}</p>
            ) : (
              <ol className="flow-steps">
                {FLOW.map((step, index) => (
                  <li key={step} className={index < stepIndex ? "done" : index === stepIndex ? "current" : ""}>
                    <span className="flow-dot">{index < stepIndex ? "✓" : index + 1}</span>
                    {FLOW_LABELS[index]}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="detail-grid">
            <article className="panel detail-card">
              <p className="eyebrow">ESTADO ACTUAL</p>
              <ChangeStatus estado={estado} />
              <p className="detail-label">Riesgo</p>
              <RiskTag riesgo={change.riesgo} />
              <p className="detail-label">Solicitante</p>
              <strong>{change.solicitante_id}</strong>
              <p className="detail-label">Aprobador</p>
              <strong>{change.aprobador_id || "Pendiente"}</strong>
            </article>
            <article className="panel detail-card">
              <p className="eyebrow">VENTANA</p>
              <p className="detail-label">Inicio</p>
              <strong>{formatDateTime(change.ventana_inicio)}</strong>
              <p className="detail-label">Fin</p>
              <strong>{formatDateTime(change.ventana_fin)}</strong>
              {change.implementado_en && (
                <>
                  <p className="detail-label">Implementado</p>
                  <strong>{formatDateTime(change.implementado_en)} por {change.implementado_por}</strong>
                </>
              )}
            </article>
            <article className="panel detail-card detail-wide">
              <p className="eyebrow">PLANES</p>
              <p className="detail-label">Plan de implementación</p>
              <p>{change.plan_implementacion || "Sin plan registrado."}</p>
              <p className="detail-label">Plan de rollback</p>
              <p>{change.plan_rollback || "Sin plan de rollback registrado."}</p>
              {change.notas_implementacion && (
                <>
                  <p className="detail-label">Notas de implementación</p>
                  <p>{change.notas_implementacion}</p>
                </>
              )}
            </article>
            <article className="panel detail-card detail-wide">
              <p className="eyebrow">RELACIONES</p>
              {change.problema_id || change.solicitud_id ? (
                <>
                  {change.problema_id && <Link className="incident-chip" to={`/problemas/${encodeURIComponent(change.problema_id)}`}>Problema {change.problema_id}</Link>}
                  {change.solicitud_id && <span className="incident-chip">Solicitud {change.solicitud_id}</span>}
                </>
              ) : (
                <p className="muted">No está vinculado a un problema ni a una solicitud.</p>
              )}
              <p className="detail-label">Registro</p>
              <p className="muted">Creado {formatDateTime(change.creado_en)} · Actualizado {formatDateTime(change.actualizado_en)}</p>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
