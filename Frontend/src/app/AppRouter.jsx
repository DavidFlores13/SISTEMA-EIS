import { Navigate, Route, Routes } from "react-router-dom";
import { RoleProtectedRoute } from "../components/RoleProtectedRoute";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import LayoutCRM from "../pages/CRM/LayoutCRM";
import ClientesView from "../pages/CRM/ClientesView";
import PipelineView from "../pages/CRM/PipelineView";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RoleProtectedRoute allowedRoles={["admin", "eis"]}>
            <DashboardPage />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/crm"
        element={
          <RoleProtectedRoute allowedRoles={["admin", "crm"]}>
            <LayoutCRM />
          </RoleProtectedRoute>
        }
      >
        <Route path="clientes" element={<ClientesView />} />
        <Route path="pipeline" element={<PipelineView />} />
        <Route index element={<Navigate to="clientes" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
