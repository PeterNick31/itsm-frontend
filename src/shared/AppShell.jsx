import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setUnauthorizedHandler } from "../services/api.js";
import { useEffect, useState } from "react";

// Iconos de trazo 16px, monocromáticos (guía: Sidebar Navigation).
const ICON_PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  problems: "M12 3 2 21h20L12 3Zm0 7v5m0 3h.01",
  incidents: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5m0 3h.01",
  changes: "M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3",
  requests: "M8 4h8l3 3v13H5V4h3Zm0 6h8m-8 4h8m-8 4h5",
  menu: "M4 7h16M4 12h16M4 17h16",
};

export function Icon({ name, className = "icon" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

// Contrato v1.1 §5: Problemas y Cambios solo para ADMIN y AGENTE.
const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "home", end: true },
  { to: "/problemas", label: "Problemas", icon: "problems", roles: ["ADMIN", "AGENTE"] },
  { label: "Incidentes", icon: "incidents", soon: true },
  { to: "/cambios", label: "Cambios", icon: "changes", roles: ["ADMIN", "AGENTE"] },
  { label: "Solicitudes", icon: "requests", soon: true },
];

export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate, signOut]);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  function logout() {
    signOut();
    navigate("/login", { replace: true });
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.rol));

  return (
    <div className="app-layout">
      <aside className={`sidebar ${drawerOpen ? "open" : ""}`} id="app-sidebar">
        <div className="brand"><span className="brand-mark brand-small">N</span><span>Northstar<span className="brand-sub">ITSM CLOUD</span></span></div>
        <p className="nav-caption">Espacio de trabajo</p>
        <nav className="main-nav" aria-label="Navegación principal">
          {visibleItems.map((item) =>
            item.soon ? (
              <span className="nav-link nav-disabled" key={item.label} title={`${item.label}: se integrará cuando esté listo el módulo del equipo`}>
                <span className="nav-icon"><Icon name={item.icon} /></span><span className="nav-label">{item.label}</span><small>Pronto</small>
              </span>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <span className="nav-icon"><Icon name={item.icon} /></span><span className="nav-label">{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>
        <div className="sidebar-bottom" title="Entorno dev · us-east-1"><span className="online-dot" /><span>Entorno dev · us-east-1</span></div>
      </aside>
      <button type="button" className={`sidebar-backdrop ${drawerOpen ? "open" : ""}`} aria-label="Cerrar menú" tabIndex={drawerOpen ? 0 : -1} onClick={() => setDrawerOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button type="button" className="sidebar-toggle" aria-label="Abrir menú" aria-controls="app-sidebar" aria-expanded={drawerOpen} onClick={() => setDrawerOpen(true)}><Icon name="menu" /></button>
            {/* Tenant de solo lectura: proviene exclusivamente del JWT (Contrato v1.1 §3). */}
            <div className="tenant-indicator"><span className="tenant-avatar">{user?.tenant_id?.charAt(0).toUpperCase()}</span><span><strong>{user?.tenant_id}</strong><small>Tenant activo</small></span></div>
          </div>
          <div className="profile-menu">
            <div className="profile-avatar">{(user?.nombre || user?.email || "A").charAt(0).toUpperCase()}</div>
            <span className="profile-text"><strong>{user?.nombre || user?.email}</strong><small>{user?.rol}</small></span>
            <button className="logout-button" onClick={logout} title="Cerrar sesión">Salir</button>
          </div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
