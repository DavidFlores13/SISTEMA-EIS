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
    if (response.status === 401 && !path.startsWith("/auth/login")) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

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

export function getClientes(estado = "") {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  const query = params.toString();
  return apiFetch(`/clientes${query ? `?${query}` : ""}`);
}

export function createCliente(payload) {
  return apiFetch("/clientes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getInteracciones(clienteId) {
  const params = new URLSearchParams();
  if (clienteId) params.set("cliente_id", String(clienteId));
  const query = params.toString();
  return apiFetch(`/interacciones?${query}`);
}

export function getOportunidades() {
  return apiFetch("/oportunidades");
}

export function createOportunidad(payload) {
  return apiFetch("/oportunidades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateOportunidad(id, payload) {
  return apiFetch(`/oportunidades/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function updateCliente(id, payload) {
  return apiFetch(`/clientes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deactivateCliente(id) {
  return apiFetch(`/clientes/${id}`, {
    method: "DELETE",
  });
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
