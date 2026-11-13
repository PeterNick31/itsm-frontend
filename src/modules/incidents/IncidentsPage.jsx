import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import {
  INCIDENT_CATEGORIES, INCIDENT_IMPACTS, INCIDENT_STATES, INCIDENT_URGENCIES,
  createIncident, listIncidents,
} from "../../services/incidents.js";
import { INCIDENT_STATE_LABELS, IncidentRows } from "./components.jsx";

const EMPTY_FORM = {
  titulo: "", descripcion: "", categoria: "SOFTWARE", impacto: "MEDIO", urgencia: "MEDIA",
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ estado: "", prioridad: "", asignado_a: "" });
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh(next = cursor) {
    setLoading(true);
    try {
      const result = await listIncidents({ ...filters, siguiente: next, limite: 20 });
      setItems(result.data);
      setNextCursor(result.paginacion?.siguiente || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listIncidents({ ...filters, siguiente: cursor, limite: 20 })
      .then((result) => {
        if (!active) return;
        setItems(result.data);
        setNextCursor(result.paginacion?.siguiente || null);
      })
      .catch((err) => { if (active) setError(apiErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, cursor]);

  function setFilter(name, value) {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCursor(null);
    setHistory([]);
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await createIncident(form);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      setCursor(null);
      setHistory([]);
      setNotice(`Incidente ${result.data.incidente_id} creado correctamente.`);
      await refresh(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return <div className="page-content">
    <div className="page-heading">
      <div>
        <p className="eyebrow">GESTIÓN ITSM</p>
        <h1>Incidentes</h1>
        <p className="muted">Registro, asignación y seguimiento de interrupciones del servicio.</p>
      </div>
      <button className="button button-primary" type="button" onClick={() => setShowForm((v) => !v)}>
        {showForm ? "Cancelar" : "+ Nuevo incidente"}
      </button>
    </div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {notice && <div className="alert" role="status">{notice}</div>}
    {showForm && <form className="panel form-grid" onSubmit={submit}>
      <div className="section-heading form-full"><div><p className="eyebrow">REGISTRO</p><h2>Nuevo incidente</h2></div></div>
      <label className="form-full">Título<input required minLength={3} maxLength={150} {...field("titulo")} /></label>
      <label className="form-full">Descripción<textarea required minLength={3} maxLength={2000} rows="3" {...field("descripcion")} /></label>
      <label>Categoría<select {...field("categoria")}>
        {INCIDENT_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <label>Impacto<select {...field("impacto")}>
        {INCIDENT_IMPACTS.map((value) => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <label>Urgencia<select {...field("urgencia")}>
        {INCIDENT_URGENCIES.map((value) => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <p className="muted" style={{ alignSelf: "center" }}>La prioridad se calcula automáticamente en el backend.</p>
      <div className="form-actions form-full">
        <button className="button button-primary" disabled={busy}>{busy ? "Guardando…" : "Registrar incidente"}</button>
      </div>
    </form>}
    <section className="panel">
      <div className="section-heading">
        <div><p className="eyebrow">REGISTRO</p><h2>Incidentes <span className="count-pill">{items.length}</span></h2></div>
        <div className="filter-controls">
          <label className="filter-control">Estado
            <select value={filters.estado} onChange={(e) => setFilter("estado", e.target.value)}>
              <option value="">Todos</option>
              {INCIDENT_STATES.map((v) => <option key={v} value={v}>{INCIDENT_STATE_LABELS[v]}</option>)}
            </select>
          </label>
          <label className="filter-control">Prioridad
            <select value={filters.prioridad} onChange={(e) => setFilter("prioridad", e.target.value)}>
              <option value="">Todas</option>
              {["P1", "P2", "P3", "P4"].map((v) => <option key={v}>{v}</option>)}
            </select>
          </label>
          {user?.rol !== "SOLICITANTE" && <label className="filter-control">Agente
            <input aria-label="ID del agente" placeholder="usr-acme-00002" value={filters.asignado_a}
              onChange={(e) => setFilter("asignado_a", e.target.value.trim())} />
          </label>}
        </div>
      </div>
      {loading ? <p className="empty-state">Cargando incidentes…</p> : <IncidentRows items={items} />}
      <div className="pagination">
        <button className="button button-secondary" disabled={!history.length || loading} onClick={() => {
          const old = [...history];
          const previous = old.pop() ?? null;
          setHistory(old);
          setCursor(previous);
        }}>← Anterior</button>
        <span>Página {history.length + 1}</span>
        <button className="button button-secondary" disabled={!nextCursor || loading} onClick={() => {
          setHistory([...history, cursor]);
          setCursor(nextCursor);
        }}>Siguiente →</button>
      </div>
      <p className="list-footnote">Mostrando datos del tenant <strong>{user?.tenant_id}</strong>.</p>
    </section>
  </div>;
}
