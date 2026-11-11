import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { createService, listCatalog, updateService } from "../../services/requests.js";
import { CATEGORY_LABELS } from "./components.jsx";

const EMPTY = { nombre: "", categoria: "ACCESOS", sla_horas: 24, requiere_aprobacion: true, es_cambio_estandar: false, activo: true };

export default function CatalogPage() {
  const { user } = useAuth();
  const isAdmin = user.rol === "ADMIN";
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | servicio_id
  const [form, setForm] = useState(EMPTY);

  async function refresh() {
    const result = await listCatalog();
    setItems(result.data);
  }

  useEffect(() => {
    refresh().catch((reason) => setError(apiErrorMessage(reason))).finally(() => setLoading(false));
  }, []);

  function open(service) {
    setError("");
    if (!service) {
      setEditing(editing === "new" ? null : "new");
      setForm(EMPTY);
      return;
    }
    setEditing(service.servicio_id);
    setForm({
      nombre: service.nombre,
      categoria: service.categoria,
      sla_horas: service.sla_horas,
      requiere_aprobacion: Boolean(service.requiere_aprobacion),
      es_cambio_estandar: Boolean(service.es_cambio_estandar),
      activo: service.activo !== false,
    });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form, sla_horas: Number(form.sla_horas) };
      if (editing === "new") await createService(payload);
      else await updateService(editing, payload);
      setEditing(null);
      await refresh();
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(service) {
    setError("");
    try {
      await updateService(service.servicio_id, { activo: service.activo === false });
      await refresh();
    } catch (reason) {
      setError(apiErrorMessage(reason));
    }
  }

  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value });
  const check = (name) => (event) => setForm({ ...form, [name]: event.target.checked });

  return (
    <div className="page-content">
      <p className="breadcrumb"><Link to="/solicitudes">Solicitudes</Link> / Catálogo</p>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN ITSM</p>
          <h1>Catálogo de servicios</h1>
          <p className="muted">Servicios que se pueden solicitar. {isAdmin ? "Como administrador puedes crearlos y editarlos." : "Solo un administrador puede modificarlos."}</p>
        </div>
        {isAdmin && <button className="button button-primary" onClick={() => open(null)}>{editing === "new" ? "Cancelar" : "+ Nuevo servicio"}</button>}
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {editing && isAdmin && (
        <form className="panel form-grid request-form" onSubmit={submit}>
          <div className="section-heading form-full"><div><p className="eyebrow">{editing === "new" ? "REGISTRO" : "EDICIÓN"}</p><h2>{editing === "new" ? "Nuevo servicio" : "Editar servicio"}</h2></div></div>
          <label className="form-full">Nombre<input required maxLength={120} value={form.nombre} onChange={set("nombre")} /></label>
          <label>Categoría
            <select value={form.categoria} onChange={set("categoria")}>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Tiempo objetivo (horas)<input type="number" min="1" required value={form.sla_horas} onChange={set("sla_horas")} /></label>
          <label className="check-field"><input type="checkbox" checked={form.requiere_aprobacion} onChange={check("requiere_aprobacion")} />Requiere aprobación</label>
          <label className="check-field"><input type="checkbox" checked={form.es_cambio_estandar} onChange={check("es_cambio_estandar")} />Es un cambio estándar</label>
          <label className="check-field"><input type="checkbox" checked={form.activo} onChange={check("activo")} />Disponible para solicitar</label>
          <div className="form-actions form-full">
            <button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="button button-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar servicio"}</button>
          </div>
        </form>
      )}

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">CATÁLOGO</p><h2>Servicios <span className="count-pill">{items.length}</span></h2></div></div>
        {loading ? <p className="empty-state">Cargando catálogo…</p> : !items.length ? (
          <p className="empty-state">Aún no hay servicios en el catálogo.{isAdmin ? " Crea el primero con el botón superior." : ""}</p>
        ) : (
          <div className="catalog-scroll">
            <table className="catalog-table">
              <thead>
                <tr><th>Servicio</th><th>Categoría</th><th>Tiempo objetivo</th><th>Aprobación</th><th>Estado</th>{isAdmin && <th><span className="sr-only">Acciones</span></th>}</tr>
              </thead>
              <tbody>
                {items.map((service) => (
                  <tr key={service.servicio_id}>
                    <td><strong>{service.nombre}</strong><br /><small className="muted">{service.servicio_id}</small></td>
                    <td>{CATEGORY_LABELS[service.categoria] || service.categoria}</td>
                    <td>{service.sla_horas} h</td>
                    <td><span className={`pill ${service.requiere_aprobacion ? "pill-warn" : "pill-on"}`}>{service.requiere_aprobacion ? "Requerida" : "Automática"}</span></td>
                    <td><span className={`pill ${service.activo === false ? "pill-off" : "pill-on"}`}>{service.activo === false ? "Inactivo" : "Activo"}</span></td>
                    {isAdmin && (
                      <td>
                        <button className="link-button" onClick={() => open(service)}>Editar</button>
                        <button className="link-button" onClick={() => toggleActive(service)}>{service.activo === false ? "Activar" : "Desactivar"}</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
