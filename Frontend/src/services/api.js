export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("eis_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Error inesperado";
    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.error || message;
    } catch {
      // Ignora errores de parseo
    }
    throw new Error(message);
  }

  return response.json();
}

export function loginRequest(username, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function getDashboardSummary() {
  return apiFetch("/dashboard/resumen");
}

export function getKpiGrowth() {
  return apiFetch("/kpis/crecimiento-mensual");
}

export function getKpiStatus({ anio, mes, id_sucursal }) {
  const params = new URLSearchParams({ anio: String(anio), mes: String(mes) });
  if (id_sucursal) params.set("id_sucursal", String(id_sucursal));
  return apiFetch(`/kpis/estado?${params.toString()}`);
}

export function getSucursales() {
  return apiFetch("/sucursales");
}

export function getVentas(idSucursal = "") {
  const params = new URLSearchParams();
  if (idSucursal) params.set("id_sucursal", String(idSucursal));
  const query = params.toString();
  return apiFetch(`/ventas${query ? `?${query}` : ""}`);
}

export function getGastos(idSucursal = "") {
  const params = new URLSearchParams();
  if (idSucursal) params.set("id_sucursal", String(idSucursal));
  const query = params.toString();
  return apiFetch(`/gastos${query ? `?${query}` : ""}`);
}

export function getMetas(idSucursal = "") {
  const params = new URLSearchParams();
  if (idSucursal) params.set("id_sucursal", String(idSucursal));
  const query = params.toString();
  return apiFetch(`/metas${query ? `?${query}` : ""}`);
}

export async function checkApiConnection() {
  const token = localStorage.getItem("eis_token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE_URL}/sucursales`, {
      method: "GET",
      headers,
    });
    return response.ok;
  } catch {
    return false;
  }
}
