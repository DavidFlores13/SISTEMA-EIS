import { useEffect, useMemo, useState } from "react";
import {
  createOportunidad,
  getClientes,
  getOportunidades,
  updateOportunidad,
} from "../../services/api";

const COLUMN_STAGES = ["Prospecto", "Propuesta", "Negociación", "Ganado"];
const ETAPAS = ["Prospecto", "Propuesta", "Negociación", "Ganado"];

const EMPTY_FORM = {
  cliente_id: "",
  titulo: "",
  descripcion: "",
  valor_estimado: "",
  etapa: "Prospecto",
  fecha_cierre_estimada: "",
};

export default function PipelineView() {
  const [oportunidades, setOportunidades] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [draggingId, setDraggingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [data, clientData] = await Promise.all([getOportunidades(), getClientes()]);
        setOportunidades(data);
        setClientes(clientData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (formMode === "edit" && selectedOpportunity) {
      setFormData({
        cliente_id: String(selectedOpportunity.cliente_id),
        titulo: selectedOpportunity.titulo || "",
        descripcion: selectedOpportunity.descripcion || "",
        valor_estimado: String(selectedOpportunity.valor_estimado || ""),
        etapa: selectedOpportunity.etapa || "Prospecto",
        fecha_cierre_estimada: selectedOpportunity.fecha_cierre_estimada || "",
      });
    }
    if (formMode === "create") {
      setFormData(EMPTY_FORM);
    }
  }, [formMode, selectedOpportunity]);

  const selectedClientName = useMemo(() => {
    if (!selectedOpportunity) return "";
    const client = clientes.find((item) => item.id === selectedOpportunity.cliente_id);
    return client?.nombre_empresa || "Cliente no encontrado";
  }, [selectedOpportunity, clientes]);

  const handleDrop = async (stage) => {
    if (!draggingId) return;
    const oportunidad = oportunidades.find((item) => item.id === draggingId);
    if (!oportunidad || oportunidad.etapa === stage) return;

    try {
      const updated = await updateOportunidad(draggingId, { etapa: stage });
      setOportunidades((current) =>
        current.map((item) => (item.id === draggingId ? updated : item))
      );
      if (selectedOpportunity?.id === draggingId) {
        setSelectedOpportunity(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDraggingId(null);
    }
  };

  const handleSelectOpportunity = (item) => {
    setSelectedOpportunity(item);
    setFormMode("edit");
  };

  const handleNewOpportunity = () => {
    setSelectedOpportunity(null);
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
        const payload = {
          ...formData,
          cliente_id: Number(formData.cliente_id),
          valor_estimado: Number(formData.valor_estimado) || 0,
        };
        const created = await createOportunidad(payload);
        setOportunidades((current) => [created, ...current]);
        setSelectedOpportunity(created);
        setFormMode("edit");
      } else if (selectedOpportunity) {
        const payload = {
          cliente_id: Number(formData.cliente_id),
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          valor_estimado: Number(formData.valor_estimado) || 0,
          etapa: formData.etapa,
          fecha_cierre_estimada: formData.fecha_cierre_estimada || null,
        };
        const updated = await updateOportunidad(selectedOpportunity.id, payload);
        setOportunidades((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        setSelectedOpportunity(updated);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Pipeline
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Embudo de Ventas</h2>
            <p className="mt-1 text-sm text-slate-600">
              Arrastra oportunidades para actualizar su etapa y alimentar el EIS.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleNewOpportunity}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Nueva oportunidad
            </button>
            <span className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              {oportunidades.length} oportunidades
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 xl:grid-cols-2">
          {COLUMN_STAGES.map((stage) => (
            <div
              key={stage}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(stage)}
              className="min-h-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-300"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">
                  {stage}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {oportunidades.filter((item) => item.etapa === stage).length}
                </span>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-slate-500">Cargando...</p>
                ) : oportunidades.filter((item) => item.etapa === stage).length === 0 ? (
                  <p className="text-sm text-slate-500">Sin oportunidades</p>
                ) : (
                  oportunidades
                    .filter((item) => item.etapa === stage)
                    .map((item) => (
                      <article
                        key={item.id}
                        draggable
                        onClick={() => handleSelectOpportunity(item)}
                        onDragStart={() => setDraggingId(item.id)}
                        className="cursor-grab rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-cyan-300 hover:bg-slate-100"
                      >
                        <p className="font-semibold text-slate-900">{item.titulo}</p>
                        <p className="mt-2 text-sm text-slate-600">Valor: LPS {item.valor_estimado}</p>
                        <p className="mt-2 text-sm text-slate-500">Cliente ID: {item.cliente_id}</p>
                      </article>
                    ))
                )}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-lg font-semibold text-slate-900">Detalle de oportunidad</p>
            <p className="text-sm text-slate-500">Haz clic en una tarjeta de oportunidad para editarla o presiona "Nueva oportunidad".</p>
          </div>

          {selectedOpportunity ? (
            <div className="mt-5 space-y-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{selectedOpportunity.titulo}</p>
              <p>{selectedClientName}</p>
              <p>Etapa: {selectedOpportunity.etapa}</p>
              <p>Valor: LPS {selectedOpportunity.valor_estimado}</p>
              {selectedOpportunity.fecha_cierre_estimada ? (
                <p>Fecha cierre: {selectedOpportunity.fecha_cierre_estimada}</p>
              ) : null}
              <p className="mt-3 text-xs text-slate-500">Creada: {selectedOpportunity.fecha_creacion}</p>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
              <p className="font-semibold text-slate-900">No hay oportunidad seleccionada</p>
              <p className="mt-2">Selecciona una tarjeta para ver su detalle.</p>
            </div>
          )}
        </aside>
      </div>

      {(formMode === "create" || (formMode === "edit" && selectedOpportunity)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {formMode === "create" ? "Nueva oportunidad" : "Editar oportunidad"}
                </p>
                <p className="text-sm text-slate-500">
                  {formMode === "create"
                    ? "Registra una oportunidad para un cliente existente."
                    : "Edita los datos de la oportunidad seleccionada."}
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
                  <span className="text-sm font-medium text-slate-600">Cliente</span>
                  <select
                    value={formData.cliente_id}
                    onChange={(event) => handleInputChange("cliente_id", event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_empresa}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Título</span>
                  <input
                    value={formData.titulo}
                    onChange={(event) => handleInputChange("titulo", event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Descripción</span>
                  <textarea
                    value={formData.descripcion}
                    onChange={(event) => handleInputChange("descripcion", event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-600">Valor estimado</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.valor_estimado}
                      onChange={(event) => handleInputChange("valor_estimado", event.target.value)}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-600">Etapa</span>
                    <select
                      value={formData.etapa}
                      onChange={(event) => handleInputChange("etapa", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    >
                      {ETAPAS.map((etapa) => (
                        <option key={etapa} value={etapa}>
                          {etapa}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-600">Fecha de cierre estimada</span>
                  <input
                    type="date"
                    value={formData.fecha_cierre_estimada}
                    onChange={(event) => handleInputChange("fecha_cierre_estimada", event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : formMode === "create" ? "Crear oportunidad" : "Actualizar oportunidad"}
                </button>
              </form>

              <div className="flex flex-col gap-4 border-l border-slate-200 pl-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Vista previa</p>
                  <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{formData.titulo || "(Sin título)"}</p>
                    <p className="mt-2 text-sm">
                      Cliente:{" "}
                      {formData.cliente_id
                        ? clientes.find((c) => c.id === Number(formData.cliente_id))?.nombre_empresa || "Desconocido"
                        : "(Selecciona uno)"}
                    </p>
                    <p className="mt-2 text-sm">Etapa: {formData.etapa}</p>
                    <p className="text-sm">Valor: LPS {formData.valor_estimado || "0"}</p>
                    {formData.fecha_cierre_estimada ? (
                      <p className="text-sm">Cierre: {formData.fecha_cierre_estimada}</p>
                    ) : null}
                  </div>
                </div>

                {formMode === "edit" && selectedOpportunity ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Información</p>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      <p>ID: {selectedOpportunity.id}</p>
                      <p>Creada: {selectedOpportunity.fecha_creacion}</p>
                      {selectedOpportunity.fecha_actualizacion ? (
                        <p>Actualizada: {selectedOpportunity.fecha_actualizacion}</p>
                      ) : null}
                    </div>
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
    </div>
  );
}
