import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    const redirectTo = user?.role === "crm" ? "/crm" : "/";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
