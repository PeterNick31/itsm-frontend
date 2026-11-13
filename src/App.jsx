import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./shared/AppShell.jsx";
import LoginPage from "./modules/auth/LoginPage.jsx";
import DashboardPage from "./modules/dashboard/DashboardPage.jsx";
import ProblemsPage from "./modules/problems/ProblemsPage.jsx";
import ProblemDetailPage from "./modules/problems/ProblemDetailPage.jsx";
import IncidentsPage from "./modules/incidents/IncidentsPage.jsx";
import IncidentDetailPage from "./modules/incidents/IncidentDetailPage.jsx";
import ChangesPage from "./modules/changes/ChangesPage.jsx";
import ChangeDetailPage from "./modules/changes/ChangeDetailPage.jsx";
import ChangeCalendarPage from "./modules/changes/ChangeCalendarPage.jsx";
import RequestsPage from "./modules/requests/RequestsPage.jsx";
import RequestDetailPage from "./modules/requests/RequestDetailPage.jsx";
import CatalogPage from "./modules/requests/CatalogPage.jsx";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="problemas" element={<ProblemsPage />} />
        <Route path="problemas/:id" element={<ProblemDetailPage />} />
        <Route path="incidentes" element={<IncidentsPage />} />
        <Route path="incidentes/:id" element={<IncidentDetailPage />} />
        <Route path="cambios" element={<ChangesPage />} />
        <Route path="cambios/calendario" element={<ChangeCalendarPage />} />
        <Route path="cambios/:id" element={<ChangeDetailPage />} />
        <Route path="solicitudes" element={<RequestsPage />} />
        <Route path="solicitudes/catalogo" element={<CatalogPage />} />
        <Route path="solicitudes/:id" element={<RequestDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
