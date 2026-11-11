import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { cancelRequest, formatDateTime, getRequest, listCatalog, runRequestAction } from "../../services/requests.js";
import { canManageRequests, currentUserId, RequestStatus } from "./components.jsx";

// Flujo unificado: EN_APROBACION -> APROBADA -> COMPLETADA (RECHAZADA y CANCELADA salen de EN_APROBACION)
const FLOW = ["EN_APROBACION", "APROBADA", "COMPLETADA"];
const FLOW_LABELS = ["En aprobación", "Aprobada", "Completada"];

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    setError("");
    getRequest(id)
      .then(async (result) => {
        setRequest(result.data);
        try {
          const catalog = await listCatalog();
          setService(catalog.data.find((item) => item.servicio_id === result.data.servicio_id) || null);
        } catch {
          setService(null); // el detalle sigue siendo útil sin el nombre del servicio
        }
      })
      .catch((reason) => setError(apiErrorMessage(reason)));
  }, [id]);

  async function perform(task) {
    setBusy(true);
    setError("");
    try {
      const result = await task();
      setRequest(result.data);
      setRejecting(false);
      setMotivo("");
    } catch (reason) {
      setError(apiErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  if (!request && !error) return <div className="page-content"><p className="muted">Cargando solicitud…</p></div>;

  const estado = request?.estado;
  const isAdmin = user.rol === "ADMIN";
  const isOwner = request?.solicitante_id === currentUserId(user);
  const canApprove = isAdmin && estado === "EN_APROBACION";
  const canComplete = canManageRequests(user) && estado === "APROBADA";
  const canCancel = (isAdmin || isOwner) && estado === "EN_APROBACION";
  const stepIndex = FLOW.indexOf(estado);

  return (
    <div className="page-content">
      <p className="breadcrumb"><Link to="/solicitudes">Solicitudes</Link> / Detalle</p>
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          {!request && <button className="alert-dismiss" onClick={() => navigate("/solicitudes")}>Volver</button>}
        </div>
      )}
      {request && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">{request.solicitud_id}</p>
              <h1>{service?.nombre || request.servicio_id}</h1>
              <p className="muted">{request.datos_formulario?.justificacion || "Sin justificación."}</p>
            </div>
            <div className="detail-actions">
              {canCancel && <button className="button button-secondary" disabled={busy} onClick={() => {
                if (window.confirm("¿Cancelar esta solicitud? No se puede deshacer.")) perform(() => cancelRequest(id));
              }}>Cancelar solicitud</button>}
              {canApprove && <button className="button button-danger" disabled={busy} onClick={() => setRejecting(!rejecting)}>{rejecting ? "Cerrar" : "Rechazar"}</button>}
              {canApprove && <button className="button button-primary" disabled={busy} onClick={() => perform(() => runRequestAction(id, "aprobar"))}>Aprobar</button>}
              {canComplete && <button className="button button-primary" disabled={busy} onClick={() => perform(() => runRequestAction(id, "completar"))}>Marcar completada</button>}
            </div>
          </div>

          {estado === "EN_APROBACION" && !isAdmin && (
            <div className="alert alert-info">Esta solicitud espera la aprobación de un usuario ADMIN.</div>
          )}
          {estado === "APROBADA" && !canComplete && (
            <div className="alert alert-info">Aprobada: queda pendiente de atención por un ADMIN o AGENTE.</div>
          )}

          {rejecting && (
            <form className="panel form-grid request-form" onSubmit={(event) => {
              event.preventDefault();
              perform(() => runRequestAction(id, "rechazar", { motivo }));
            }}>
              <div className="section-heading form-full"><div><p className="eyebrow">APROBACIÓN</p><h2>Rechazar solicitud</h2></div></div>
              <label className="form-full">Motivo del rechazo
                <textarea required rows="3" maxLength={1000} value={motivo} onChange={(event) => setMotivo(event.target.value)} />
              </label>
              <div className="form-actions form-full">
                <button type="button" className="button button-secondary" onClick={() => setRejecting(false)}>Cancelar</button>
                <button className="button button-danger" disabled={busy}>{busy ? "Guardando…" : "Confirmar rechazo"}</button>
              </div>
            </form>
          )}

          <section className="panel req-flow" aria-label="Ciclo de vida de la solicitud">
            {estado === "RECHAZADA" ? (
              <p className="req-flow-closed rejected">Esta solicitud fue <strong>rechazada</strong>{request.motivo_rechazo ? `: ${request.motivo_rechazo}` : "."}</p>
            ) : estado === "CANCELADA" ? (
              <p className="req-flow-closed cancelled">Esta solicitud fue <strong>cancelada</strong>.</p>
            ) : (
              <ol className="req-flow-steps">
                {FLOW.map((step, index) => (
                  <li key={step} className={index < stepIndex ? "done" : index === stepIndex ? "current" : ""}>
                    <span className="req-flow-dot">{index < stepIndex ? "✓" : index + 1}</span>
                    {FLOW_LABELS[index]}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="detail-grid">
            <article className="panel detail-card">
              <p className="eyebrow">ESTADO ACTUAL</p>
              <RequestStatus estado={estado} />
              <p className="detail-label">Solicitante</p>
              <strong>{request.solicitante_id}</strong>
              <p className="detail-label">Aprobador</p>
              <strong>{request.aprobador_id || (estado === "EN_APROBACION" ? "Pendiente" : "No aplica")}</strong>
            </article>
            <article className="panel detail-card">
              <p className="eyebrow">SERVICIO</p>
              <p className="detail-label">Nombre</p>
              <strong>{service?.nombre || request.servicio_id}</strong>
              <p className="detail-label">Tiempo objetivo</p>
              <strong>{service ? `${service.sla_horas} h` : "—"}</strong>
              <p className="detail-label">Aprobación</p>
              <strong>{service ? (service.requiere_aprobacion ? "Requerida" : "Automática") : "—"}</strong>
            </article>
            <article className="panel detail-card detail-wide">
              <p className="eyebrow">REGISTRO</p>
              <p className="detail-label">Creada</p>
              <p>{formatDateTime(request.creado_en)}</p>
              <p className="detail-label">Última actualización</p>
              <p>{formatDateTime(request.actualizado_en)}</p>
              {request.cambio_id && (
                <>
                  <p className="detail-label">Cambio vinculado</p>
                  <Link className="incident-chip" to={`/cambios/${encodeURIComponent(request.cambio_id)}`}>{request.cambio_id}</Link>
                </>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
