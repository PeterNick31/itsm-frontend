import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import {
  INCIDENT_CATEGORIES, addIncidentComment, assignIncident, changeIncidentState,
  deleteIncident, escalateIncident, getIncident, incidentDate, listIncidentComments, updateIncident,
} from "../../services/incidents.js";
import { canManageIncidents, INCIDENT_STATE_LABELS, INCIDENT_TRANSITIONS, IncidentStatus } from "./components.jsx";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = canManageIncidents(user);
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [moreComments, setMoreComments] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState("");
  const [nextState, setNextState] = useState("");
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [edit, setEdit] = useState({ titulo: "", descripcion: "", categoria: "" });

  async function refresh() {
    const [incident, messages] = await Promise.all([
      getIncident(id), listIncidentComments(id, { limite: 100 }),
    ]);
    setItem(incident.data);
    setComments(messages.data);
    setMoreComments(messages.paginacion?.siguiente || null);
    setAssignee(incident.data?.asignado_a || "");
    setEdit({
      titulo: incident.data?.titulo || "",
      descripcion: incident.data?.descripcion || "",
      categoria: incident.data?.categoria || "SOFTWARE",
    });
    setNextState("");
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([getIncident(id), listIncidentComments(id, { limite: 100 })])
      .then(([incident, messages]) => {
        if (!active) return;
        setItem(incident.data);
        setComments(messages.data);
        setMoreComments(messages.paginacion?.siguiente || null);
        setAssignee(incident.data?.asignado_a || "");
        setEdit({
          titulo: incident.data?.titulo || "",
          descripcion: incident.data?.descripcion || "",
          categoria: incident.data?.categoria || "SOFTWARE",
        });
      })
      .catch((err) => { if (active) setError(apiErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function run(action, confirmation) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
      setNotice("Operación registrada correctamente.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    await run(() => updateIncident(id, edit));
    setEditMode(false);
  }

  async function saveComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    await run(() => addIncidentComment(id, comment.trim()));
    setComment("");
  }

  async function removeIncident() {
    if (!window.confirm(`¿Eliminar el incidente ${id}? Esta operación es irreversible.`)) return;
    setBusy(true);
    setError("");
    try {
      await deleteIncident(id);
      navigate("/incidentes", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  }

  const available = INCIDENT_TRANSITIONS[item?.estado] || [];
  if (loading) return <div className="page-content"><p className="muted">Cargando incidente…</p></div>;
  if (!item) return <div className="page-content">
    <p className="breadcrumb"><Link to="/incidentes">← Volver a Incidentes</Link></p>
    <div className="alert alert-error">{error || "No encontramos el incidente solicitado."}</div>
  </div>;

  return <div className="page-content">
    <p className="breadcrumb"><Link to="/incidentes">← Incidentes</Link> / {item.incidente_id}</p>
    <div className="page-heading">
      <div>
        <p className="eyebrow">DETALLE DEL INCIDENTE</p>
        <h1>{item.titulo}</h1>
        <div className="incident-meta">
          <IncidentStatus estado={item.estado} />
          <span>Prioridad {item.prioridad}</span>
          <span>{item.categoria}</span>
          {item.escalado && <span>Escalado a Problemas</span>}
        </div>
      </div>
      {canManage && item.estado !== "CERRADO" &&
        <button className="button button-secondary" onClick={() => setEditMode((v) => !v)}>
          {editMode ? "Cancelar edición" : "Editar"}
        </button>}
    </div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {notice && <div className="alert" role="status">{notice}</div>}
    {editMode && canManage && item.estado !== "CERRADO" && <form className="panel form-grid" onSubmit={saveEdit}>
      <div className="section-heading form-full"><h2>Editar información</h2></div>
      <label className="form-full">Título<input required minLength={3} maxLength={150} value={edit.titulo}
        onChange={(e) => setEdit((old) => ({ ...old, titulo: e.target.value }))} /></label>
      <label className="form-full">Descripción<textarea required minLength={3} maxLength={2000} rows="3" value={edit.descripcion}
        onChange={(e) => setEdit((old) => ({ ...old, descripcion: e.target.value }))} /></label>
      <label>Categoría<select value={edit.categoria}
        onChange={(e) => setEdit((old) => ({ ...old, categoria: e.target.value }))}>
        {INCIDENT_CATEGORIES.map((v) => <option key={v}>{v}</option>)}
      </select></label>
      <div className="form-actions"><button className="button button-primary" disabled={busy}>Guardar cambios</button></div>
    </form>}
    <div className="detail-grid">
      <section className="panel detail-card">
        <p className="eyebrow">DATOS DEL INCIDENTE</p>
        <p className="detail-label">Identificador</p><strong>{item.incidente_id}</strong>
        <p className="detail-label">Reportado por</p><strong>{item.solicitante_id}</strong>
        <p className="detail-label">Asignado a</p><strong>{item.asignado_a || "Sin asignar"}</strong>
        <p className="detail-label">Impacto / Urgencia</p><strong>{item.impacto} / {item.urgencia}</strong>
        <p className="detail-label">Creado el</p><strong>{incidentDate(item.creado_en)}</strong>
        <p className="detail-label">SLA vence</p><strong>{incidentDate(item.sla_vence_en)}</strong>
        {item.problema_id && <p><Link className="text-link" to={`/problemas/${encodeURIComponent(item.problema_id)}`}>Ver problema vinculado →</Link></p>}
      </section>
      <section className="panel detail-card">
        <p className="eyebrow">DESCRIPCIÓN</p>
        <p className="incident-description">{item.descripcion}</p>
        <p className="detail-label">Estado actual</p>
        <IncidentStatus estado={item.estado} />
        <p className="detail-label">Última actualización</p>
        <strong>{incidentDate(item.actualizado_en || item.creado_en)}</strong>
      </section>
    </div>
    {canManage && item.estado !== "CERRADO" && <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">GESTIÓN</p><h2>Acciones del incidente</h2></div></div>
      {item.estado !== "RESUELTO" && <div className="incident-actions">
        <label>Asignar agente (ID del mismo tenant)
          <input value={assignee} placeholder={`usr-${user?.tenant_id}-00002`}
            onChange={(e) => setAssignee(e.target.value)} />
        </label>
        <button className="button button-secondary" disabled={busy || !assignee.trim() || assignee === item.asignado_a}
          onClick={() => run(() => assignIncident(id, assignee.trim()))}>Asignar</button>
      </div>}
      {available.length > 0 && <div className="incident-actions incident-section-actions">
        <label>Cambiar estado
          <select value={nextState} onChange={(e) => setNextState(e.target.value)}>
            <option value="">Selecciona un estado</option>
            {available.map((v) => <option value={v} key={v}>{INCIDENT_STATE_LABELS[v]}</option>)}
          </select>
        </label>
        <button className="button button-primary" disabled={busy || !nextState}
          onClick={() => run(() => changeIncidentState(id, nextState))}>Guardar estado</button>
      </div>}
      {item.estado === "NUEVO" && <p className="muted incident-section-actions">Para pasar de Nuevo a Asignado, primero asigna un agente.</p>}
      {!item.escalado && <div className="incident-actions incident-section-actions">
        <label>Motivo de escalamiento (opcional)
          <input value={reason} maxLength={1000} placeholder="Causa recurrente, investigación requerida…"
            onChange={(e) => setReason(e.target.value)} />
        </label>
        <button className="button button-secondary" disabled={busy}
          onClick={() => run(() => escalateIncident(id, reason.trim()), "¿Escalar este incidente a Problemas?")}>
          Escalar a Problemas
        </button>
      </div>}
      {user?.rol === "ADMIN" && item.estado === "NUEVO" && <div className="incident-section-actions">
        <button className="button button-secondary" disabled={busy} onClick={removeIncident}>Eliminar incidente nuevo</button>
      </div>}
    </section>}
    <section className="panel">
      <div className="section-heading"><div><p className="eyebrow">COLABORACIÓN</p><h2>Comentarios ({comments.length}{moreComments ? "+" : ""})</h2></div></div>
      {comments.length ? comments.map((c) => <div className="incident-comment" key={c.comentario_id}>
        <small>{c.autor_id} ({c.autor_rol}) · {incidentDate(c.creado_en)}</small>
        <p>{c.texto}</p>
      </div>) : <p className="muted">Aún no hay comentarios.</p>}
      {moreComments && <button className="button button-secondary incident-section-actions" disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const next = await listIncidentComments(id, { limite: 100, siguiente: moreComments });
            setComments((old) => [...old, ...next.data]);
            setMoreComments(next.paginacion?.siguiente || null);
          } catch (err) { setError(apiErrorMessage(err)); }
          finally { setBusy(false); }
        }}>Cargar más comentarios</button>}
      {item.estado !== "CERRADO" && <form onSubmit={saveComment} className="incident-section-actions">
        <label>Nuevo comentario<textarea rows="3" required maxLength={2000} value={comment}
          onChange={(e) => setComment(e.target.value)} placeholder="Escribe una actualización del incidente…" /></label>
        <div className="form-actions incident-section-actions"><button className="button button-primary" disabled={busy || !comment.trim()}>
          {busy ? "Guardando…" : "Publicar comentario"}</button></div>
      </form>}
    </section>
  </div>;
}
