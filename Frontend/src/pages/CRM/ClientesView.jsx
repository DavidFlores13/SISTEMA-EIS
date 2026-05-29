import { useEffect, useMemo, useState } from "react";
import { createCliente, getClientes, getInteracciones, updateCliente } from "../../services/api";

const ESTADOS = ["Prospecto", "Propuesta", "Negociación", "Ganado", "Inactivo"];

const EMPTY_FORM = {
  nombre_empresa: "",
  rtn: "",
  nombre_contacto: "",
  correo: "",
  telefono: "",
  direccion: "",
  estado: "Prospecto",
};

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [interacciones, setInteracciones] = useState([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchesSearch =
        cliente.nombre_empresa.toLowerCase().includes(search.toLowerCase()) ||
        cliente.nombre_contacto.toLowerCase().includes(search.toLowerCase()) ||
        cliente.correo.toLowerCase().includes(search.toLowerCase());
      const matchesEstado = estado ? cliente.estado === estado : true;
      return matchesSearch && matchesEstado;
    });
  }, [clientes, search, estado]);

  useEffect(() => {
    async function loadClientes() {
      setLoading(true);
      setError("");
      try {
        const data = await getClientes();
        setClientes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadClientes();
  }, []);

  useEffect(() => {
    async function loadInteractions() {
      if (!selectedClient) {
        setInteracciones([]);
        return;
      }

      setLoadingInteractions(true);
      try {
        const data = await getInteracciones(selectedClient.id);
        setInteracciones(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingInteractions(false);
      }
    }

    loadInteractions();
  }, [selectedClient]);

  useEffect(() => {
    if (formMode === "edit" && selectedClient) {
      setFormData({
        nombre_empresa: selectedClient.nombre_empresa || "",
        rtn: selectedClient.rtn || "",
        nombre_contacto: selectedClient.nombre_contacto || "",
        correo: selectedClient.correo || "",
        telefono: selectedClient.telefono || "",
        direccion: selectedClient.direccion || "",
        estado: selectedClient.estado || "Prospecto",
      });
    }
    if (formMode === "create") {
      setFormData(EMPTY_FORM);
    }
  }, [formMode, selectedClient]);

  const handleRowClick = (cliente) => {
    setSelectedClient(cliente);
    setFormMode("edit");
  };

  const handleNewClient = () => {
    setSelectedClient(null);
    setFormMode("create");
  };

  const handleInputChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (formMode === "create") {
        const created = await createCliente(formData);
        setClientes((current) => [created, ...current]);
        setSelectedClient(created);
        setFormMode("edit");
      } else if (selectedClient) {
        const updated = await updateCliente(selectedClient.id, formData);
        setClientes((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedClient(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Clientes
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Directorio de Clientes
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleNewClient}
                className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Nuevo cliente
              </button>
              <span className="rounded-full bg-white px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                Total: {filteredClientes.length}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Empresa, contacto o correo"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600">Estado</span>
              <select
                value={estado}
                onChange={(event) => setEstado(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Todos</option>
                {ESTADOS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      Cargando clientes...
                    </td>
                  </tr>
                ) : filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      onClick={() => handleRowClick(cliente)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${
                        selectedClient?.id === cliente.id ? "bg-slate-100" : ""
                      }`}
                    >
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {cliente.nombre_empresa}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{cliente.nombre_contacto}</td>
                      <td className="px-4 py-4 text-slate-600">{cliente.correo}</td>
                      <td className="px-4 py-4 text-slate-600">{cliente.estado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-lg font-semibold text-slate-900">Ficha técnica</p>
            <p className="text-sm text-slate-500">
              Haz clic en un cliente para ver sus datos o presiona "Nuevo cliente".
            </p>
          </div>

          {selectedClient ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{selectedClient.nombre_empresa}</p>
                <p>{selectedClient.nombre_contacto}</p>
                <p>{selectedClient.correo}</p>
                {selectedClient.telefono ? <p>{selectedClient.telefono}</p> : null}
                {selectedClient.direccion ? <p>{selectedClient.direccion}</p> : null}
                <p className="mt-2 text-xs text-slate-500">Estado: {selectedClient.estado}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Interacciones recientes</h4>
                {loadingInteractions ? (
                  <p className="mt-3 text-sm text-slate-500">Cargando historial...</p>
                ) : interacciones.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Aún no hay interacciones registradas.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {interacciones.slice(0, 5).map((item) => (
                      <li key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="font-semibold text-slate-900">{item.tipo_interaccion}</p>
                        <p>{item.comentarios}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(item.fecha_interaccion).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
              <p className="font-semibold text-slate-900">No hay cliente seleccionado</p>
              <p className="mt-2">Selecciona un cliente para ver su ficha técnica.</p>
            </div>
          )}
        </aside>
      </div>

      {(formMode === "create" || (formMode === "edit" && selectedClient)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {formMode === "create" ? "Crear cliente" : "Editar cliente"}
                </p>
                <p className="text-sm text-slate-500">
                  {formMode === "create"
                    ? "Registra un nuevo cliente para el CRM."
                    : "Actualiza los datos del cliente seleccionado."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormMode(null)}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Empresa</span>
                  <input
                    value={formData.nombre_empresa}
                    onChange={(event) => handleInputChange("nombre_empresa", event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">RTN</span>
                  <input
                    value={formData.rtn}
                    onChange={(event) => handleInputChange("rtn", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Contacto</span>
                  <input
                    value={formData.nombre_contacto}
                    onChange={(event) => handleInputChange("nombre_contacto", event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Correo</span>
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(event) => handleInputChange("correo", event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Teléfono</span>
                  <input
                    value={formData.telefono}
                    onChange={(event) => handleInputChange("telefono", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Dirección</span>
                  <input
                    value={formData.direccion}
                    onChange={(event) => handleInputChange("direccion", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Estado</span>
                  <select
                    value={formData.estado}
                    onChange={(event) => handleInputChange("estado", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    {ESTADOS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : formMode === "create" ? "Crear cliente" : "Guardar cambios"}
                </button>
              </form>

              <div className="flex flex-col gap-4 border-l border-slate-200 pl-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Vista previa</p>
                  <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{formData.nombre_empresa || "(Empresa)"}</p>
                    <p className="mt-2 text-sm">{formData.nombre_contacto || "(Contacto)"}</p>
                    <p className="text-sm">{formData.correo || "(correo@ejemplo.com)"}</p>
                    {formData.telefono ? <p className="text-sm">{formData.telefono}</p> : null}
                    {formData.direccion ? <p className="text-sm">{formData.direccion}</p> : null}
                    <p className="mt-3 text-xs text-slate-500">Estado: {formData.estado}</p>
                  </div>
                </div>

                {formMode === "edit" && selectedClient && interacciones.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Últimas interacciones</p>
                    <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                      {interacciones.slice(0, 3).map((item) => (
                        <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                          <p className="font-semibold text-slate-900">{item.tipo_interaccion}</p>
                          <p className="mt-1 text-slate-600">{item.comentarios?.substring(0, 50)}...</p>
                          <p className="mt-1 text-slate-500">{new Date(item.fecha_interaccion).toLocaleDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
