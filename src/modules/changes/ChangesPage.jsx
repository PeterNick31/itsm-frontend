import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { CHANGE_RISKS, CHANGE_STATES, CHANGE_TYPES, createChange, listChanges } from "../../services/changes.js";
import { canManageChanges, ChangeRows, NoAccess, STATE_LABELS } from "./components.jsx";

const EMPTY_FORM = {
  titulo: "",
  descripcion: "",
  tipo: "NORMAL",
  riesgo: "MEDIO",
  plan_implementacion: "",
  plan_rollback: "",
  problema_id: "",
};

export default function ChangesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ estado: "", tipo: "", riesgo: "" });
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh(pageCursor = cursor) {
    setLoading(true);
    try {
      const result = await listChanges({ ...filters, limite: 20, siguiente: pageCursor });
      setItems(result.data);
      setNextCursor(result.paginacion?.siguiente || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canManageChanges(user)) return;
    setError("");
    refresh(cursor).catch((reason) => setError(apiErrorMessage(reason)));
  }, [filters, cursor]);

  if (!canManageChanges(user)) return <NoAccess />;

  function setFilter(name, value) {
    setFilters({ ...filters, [name]: value });
    setCursor(null);
    setHistory([]);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form, problema_id: form.problema_id.trim() || null };
      await createChange(payload);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setCursor(null);
      setHistory([]);
      await refresh(null);
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const field = (name) => ({ value: form[name], onChange: (event) => setForm({ ...form, [name]: event.target.value }) });

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN ITSM</p>
          <h1>Cambios</h1>
          <p className="muted">Solicitudes de cambio (RFC): evaluación de riesgo, aprobación y ventanas de implementación.</p>
        </div>
        <div className="detail-actions">
          <Link className="button button-secondary" to="/cambios/calendario">Calendario</Link>
          <button className="button button-primary" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "+ Nuevo cambio"}</button>
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {showForm && (
        <form className="panel form-grid" onSubmit={submit}>
          <div className="section-heading form-full"><div><p className="eyebrow">REGISTRO</p><h2>Nueva solicitud de cambio</h2></div></div>
          <label className="form-full">Título<input required maxLength={200} {...field("titulo")} /></label>
          <label className="form-full">Descripción<textarea rows="2" {...field("descripcion")} /></label>
          <label>Tipo<select {...field("tipo")}>{CHANGE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Riesgo<select {...field("riesgo")}>{CHANGE_RISKS.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="form-full">Plan de implementación<textarea rows="2" {...field("plan_implementacion")} /></label>
          <label className="form-full">Plan de rollback<textarea rows="2" {...field("plan_rollback")} /></label>
          <label>Problema relacionado (opcional)<input placeholder={`prb-${user.tenant_id}-000123`} pattern={`prb-${user.tenant_id}-.+`} {...field("problema_id")} /></label>
          <div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Guardando…" : "Crear en borrador"}</button></div>
        </form>
      )}
      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">REGISTRO</p><h2>Cambios <span className="count-pill">{items.length}</span></h2></div>
          <div className="filter-controls">
            <label className="filter-control"><span>Estado</span>
              <select value={filters.estado} onChange={(event) => setFilter("estado", event.target.value)}>
                <option value="">Todos</option>
                {CHANGE_STATES.map((value) => <option key={value} value={value}>{STATE_LABELS[value]}</option>)}
              </select>
            </label>
            <label className="filter-control"><span>Tipo</span>
              <select value={filters.tipo} onChange={(event) => setFilter("tipo", event.target.value)}>
                <option value="">Todos</option>
                {CHANGE_TYPES.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="filter-control"><span>Riesgo</span>
              <select value={filters.riesgo} onChange={(event) => setFilter("riesgo", event.target.value)}>
                <option value="">Todos</option>
                {CHANGE_RISKS.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
        </div>
        {loading && !items.length ? <p className="empty-state">Cargando cambios…</p> : <ChangeRows items={items} />}
        <div className="pagination">
          <button className="button button-secondary" disabled={!history.length || loading} onClick={() => {
            const previous = [...history];
            const last = previous.pop() ?? null;
            setHistory(previous);
            setCursor(last);
          }}>← Anterior</button>
          <span>Página {history.length + 1}</span>
          <button className="button button-secondary" disabled={!nextCursor || loading} onClick={() => {
            setHistory([...history, cursor]);
            setCursor(nextCursor);
          }}>Siguiente →</button>
        </div>
        <p className="list-footnote">Mostrando datos del tenant <strong>{user.tenant_id}</strong>.</p>
      </section>
    </div>
  );
}
