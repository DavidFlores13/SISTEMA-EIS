/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("eis_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("eis_user");
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(username, password);
      localStorage.setItem("eis_token", data.token);
      localStorage.setItem("eis_user", JSON.stringify(data.user || { username, role: "eis" }));
      setToken(data.token);
      setUser(data.user || { username, role: "eis" });
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("eis_token");
    localStorage.removeItem("eis_user");
    setToken("");
    setUser(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({ token, user, role: user?.role, isAuthenticated: Boolean(token), login, logout, loading }),
    [token, user, logout, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
