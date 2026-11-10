import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiErrorMessage } from "../../services/api.js";
import { getCalendar } from "../../services/changes.js";
import { canManageChanges, ChangeStatus, NoAccess } from "./components.jsx";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isoNoMs(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export default function ChangeCalendarPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!canManageChanges(user)) return;
    const desde = isoNoMs(month);
    const hasta = isoNoMs(new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, -1));
    setLoading(true);
    setError("");
    getCalendar({ desde, hasta })
      .then((result) => {
        setItems(result.data);
        setTruncated(Boolean(result.truncado));
      })
      .catch((reason) => setError(apiErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, [month]);

  const byDay = useMemo(() => {
    const groups = new Map();
    for (const item of items) {
      const key = dayKey(new Date(item.ventana_inicio));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return groups;
  }, [items]);

  if (!canManageChanges(user)) return <NoAccess />;

  const leading = (month.getDay() + 6) % 7; // semana inicia en lunes
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const todayKey = dayKey(new Date());
  const title = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(month);
  const time = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
  const shift = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const upcoming = items.filter((item) => item.estado === "PROGRAMADO");

  return (
    <div className="page-content">
      <p className="breadcrumb"><Link to="/cambios">Cambios</Link> / Calendario</p>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VENTANAS DE MANTENIMIENTO</p>
          <h1>Calendario de cambios</h1>
          <p className="muted">Cambios programados e implementados según su ventana de inicio (hora local).</p>
        </div>
        <div className="detail-actions calendar-nav">
          <button className="button button-secondary" onClick={() => shift(-1)} aria-label="Mes anterior">←</button>
          <span className="calendar-title">{title}</span>
          <button className="button button-secondary" onClick={() => shift(1)} aria-label="Mes siguiente">→</button>
        </div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {truncated && <div className="alert alert-info">Se muestran los primeros 1000 cambios del mes.</div>}
      <section className="panel calendar-panel" aria-busy={loading}>
        <div className="calendar-grid">
          {WEEKDAYS.map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
          {cells.map((date, index) => {
            if (!date) return <div className="calendar-cell calendar-empty" key={`empty-${index}`} />;
            const key = dayKey(date);
            const dayItems = byDay.get(key) || [];
            return (
              <div className={`calendar-cell ${key === todayKey ? "calendar-today" : ""}`} key={key}>
                <span className="calendar-day">{date.getDate()}</span>
                {dayItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.cambio_id}
                    to={`/cambios/${encodeURIComponent(item.cambio_id)}`}
                    className={`calendar-event change-${item.estado}`}
                    title={`${item.titulo} (${item.cambio_id})`}
                  >
                    {time.format(new Date(item.ventana_inicio))} {item.titulo}
                  </Link>
                ))}
                {dayItems.length > 3 && <span className="calendar-more">+{dayItems.length - 3} más</span>}
              </div>
            );
          })}
        </div>
        {loading && <p className="list-footnote">Cargando ventanas…</p>}
      </section>
      <section className="panel">
        <div className="section-heading">
          <div><p className="eyebrow">ESTE MES</p><h2>Programados <span className="count-pill">{upcoming.length}</span></h2></div>
        </div>
        {upcoming.length ? (
          <div className="problem-list">
            {upcoming.slice(0, 15).map((item) => (
              <Link className="problem-row" to={`/cambios/${encodeURIComponent(item.cambio_id)}`} key={item.cambio_id}>
                <span className={`risk-dot risk-dot-${item.riesgo}`} />
                <span className="problem-row-main">
                  <strong>{item.titulo}</strong>
                  <small><span className="mono">{item.cambio_id}</span> · {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.ventana_inicio))}</small>
                </span>
                <ChangeStatus estado={item.estado} />
                <span className="row-chevron" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">No hay cambios programados en este mes.</p>
        )}
      </section>
    </div>
  );
}
