import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { createRequest, listCatalog, listRequests, REQUEST_STATES } from "../../services/requests.js";
import { CATEGORY_LABELS, RequestRows, STATE_LABELS } from "./components.jsx";

const EMPTY_FORM = { servicio_id: "", justificacion: "" };

export default function RequestsPage() {
  const { user } = useAuth();
  const [catalogList, setCatalogList] = useState([]);
  const [items, setItems] = useState([]);
  const [estado, setEstado] = useState("");
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const catalog = useMemo(() => Object.fromEntries(catalogList.map((item) => [item.servicio_id, item])), [catalogList]);
  const activeServices = catalogList.filter((item) => item.activo !== false);
  const selected = catalog[form.servicio_id];
  const isSolicitante = user.rol === "SOLICITANTE";

  async function refresh(pageCursor = cursor) {
    setLoading(true);
    try {
      const result = await listRequests({ estado, limite: 20, siguiente: pageCursor });
      setItems(result.data);
      setNextCursor(result.paginacion?.siguiente || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listCatalog().then((result) => setCatalogList(result.data)).catch((reason) => setError(apiErrorMessage(reason)));
  }, []);

  useEffect(() => {
    setError("");
    refresh(cursor).catch((reason) => setError(apiErrorMessage(reason)));
  }, [estado, cursor]);

  function changeEstado(value) {
    setEstado(value);
    setCursor(null);
    setHistory([]);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await createRequest({
        servicio_id: form.servicio_id,
        datos_formulario: form.justificacion.trim() ? { justificacion: form.justificacion.trim() } : {},
      });
      setNotice(`Solicitud ${result.data.solicitud_id} creada: ${STATE_LABELS[result.data.estado].toLowerCase()}.`);
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

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN ITSM</p>
          <h1>Solicitudes</h1>
          <p className="muted">
            {isSolicitante
              ? "Pide un servicio del catálogo y sigue el estado de tus solicitudes."
              : "Solicitudes de servicio del catálogo: aprobación, atención y cierre."}
          </p>
        </div>
        <div className="detail-actions">
          <Link className="button button-secondary" to="/solicitudes/catalogo">Catálogo de servicios</Link>
          <button className="button button-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nueva solicitud"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      {showForm && (
        <form className="panel form-grid request-form" onSubmit={submit}>
          <div className="section-heading form-full"><div><p className="eyebrow">REGISTRO</p><h2>Nueva solicitud</h2></div></div>
          <label className="form-full">Servicio
            <select required value={form.servicio_id} onChange={(event) => setForm({ ...form, servicio_id: event.target.value })}>
              <option value="">Elige un servicio…</option>
              {activeServices.map((service) => (
                <option key={service.servicio_id} value={service.servicio_id}>
                  {service.nombre} ({CATEGORY_LABELS[service.categoria] || service.categoria})
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <p className="service-hint form-full">
              Tiempo objetivo: <strong>{selected.sla_horas} h</strong>.{" "}
              {selected.requiere_aprobacion
                ? "Este servicio necesita la aprobación de un administrador antes de atenderse."
                : "Este servicio se aprueba automáticamente y pasa directo a atención."}
            </p>
          )}
          <label className="form-full">Justificación (opcional)
            <textarea rows="3" maxLength={1000} value={form.justificacion} placeholder="Cuéntanos para qué lo necesitas"
              onChange={(event) => setForm({ ...form, justificacion: event.target.value })} />
          </label>
          <div className="form-actions form-full">
            <button className="button button-primary" disabled={busy || !form.servicio_id}>{busy ? "Enviando…" : "Crear solicitud"}</button>
          </div>
        </form>
      )}

      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">{isSolicitante ? "MIS SOLICITUDES" : "REGISTRO"}</p><h2>Solicitudes <span className="count-pill">{items.length}</span></h2></div>
          <div className="filter-controls">
            <label className="filter-control"><span>Estado</span>
              <select value={estado} onChange={(event) => changeEstado(event.target.value)}>
                <option value="">Todos</option>
                {REQUEST_STATES.map((value) => <option key={value} value={value}>{STATE_LABELS[value]}</option>)}
              </select>
            </label>
          </div>
        </div>
        {loading && !items.length ? <p className="empty-state">Cargando solicitudes…</p> : <RequestRows items={items} catalog={catalog} />}
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
