import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import { useFilters } from "../context/FiltersContext";
import { checkApiConnection, getGastos, getMetas, getSucursales, getVentas } from "../services/api";
import { KpiCard } from "../components/KpiCard";
import { FiltersBar } from "../components/FiltersBar";

const PIE_COLORS = ["#0b1d3a", "#22d3ee", "#2dd4bf", "#0ea5e9", "#14b8a6", "#1d4ed8"];
const SECTION_ITEMS = [
  { id: "resumen", label: "Resumen" },
  { id: "tendencia", label: "Tendencia" },
  { id: "comparativo", label: "Real vs Meta" },
  { id: "gastos", label: "Gastos" },
  { id: "alertas", label: "Alertas" },
  { id: "detalle", label: "Detalle" },
];

function money(value) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL" }).format(value || 0);
}

function monthKey(date) {
  if (!date) return "";
  return String(date).slice(0, 7);
}

function getPrevPeriod(anio, mes) {
  const current = new Date(anio, mes - 1, 1);
  current.setMonth(current.getMonth() - 1);
  return {
    anio: current.getFullYear(),
    mes: current.getMonth() + 1,
    key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
  };
}

function getEstado(cumplimiento) {
  if (cumplimiento >= 100) return "verde";
  if (cumplimiento >= 80) return "amarillo";
  return "rojo";
}

function getEstadoLabel(estado) {
  if (estado === "verde") return "Cumplida";
  if (estado === "amarillo") return "En riesgo";
  return "Critica";
}

function ApiStatusIndicator({ connected }) {
  const isConnected = connected === true;
  const isUnknown = connected === null;

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        isUnknown
          ? "border-slate-300 bg-slate-100 text-slate-600"
          : isConnected
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-red-300 bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          isUnknown ? "bg-slate-300 text-white" : isConnected ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {isUnknown ? "..." : isConnected ? "✓" : "X"}
      </span>
      <span>{isUnknown ? "Verificando API" : isConnected ? "API conectada" : "API desconectada"}</span>
    </div>
  );
}

function EstadoChip({ estado }) {
  const tone =
    estado === "verde"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : estado === "amarillo"
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-red-300 bg-red-50 text-red-700";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {getEstadoLabel(estado)}
    </span>
  );
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const { filters, updateFilters } = useFilters();

  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState("");
  const [apiConnected, setApiConnected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeSection, setActiveSection] = useState("resumen");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyConnection() {
      const ok = await checkApiConnection();
      if (mounted) setApiConnected(ok);
    }

    verifyConnection();
    const intervalId = setInterval(verifyConnection, 15000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      let current = SECTION_ITEMS[0].id;
      const scrollPosition = window.scrollY + 220;
      let bestOffset = -1;

      for (const section of SECTION_ITEMS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        // Usa el offset mas cercano sin pasarse del punto de lectura.
        // En empates (misma fila), conserva el primer item definido en SECTION_ITEMS.
        if (el.offsetTop <= scrollPosition && el.offsetTop > bestOffset) {
          bestOffset = el.offsetTop;
          current = section.id;
        }
      }

      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (isAtBottom) {
        current = SECTION_ITEMS[SECTION_ITEMS.length - 1].id;
      }

      setActiveSection(current);
    }

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [ventasData, gastosData, metasData, sucursalesData] = await Promise.all([
          getVentas(),
          getGastos(),
          getMetas(),
          getSucursales(),
        ]);

        if (!mounted) return;
        setVentas(ventasData);
        setGastos(gastosData);
        setMetas(metasData);
        setSucursales(sucursalesData);
        setApiConnected(true);
        setError("");
        setLastUpdated(new Date());

        // Si el periodo actual no tiene datos, mover filtros al ultimo periodo disponible.
        const periodSet = new Set();
        ventasData.forEach((item) => periodSet.add(monthKey(item.fecha)));
        gastosData.forEach((item) => periodSet.add(monthKey(item.fecha)));
        metasData.forEach((item) =>
          periodSet.add(`${item.anio}-${String(item.mes).padStart(2, "0")}`)
        );

        const availablePeriods = Array.from(periodSet).filter(Boolean).sort((a, b) =>
          a.localeCompare(b)
        );
        const currentPeriod = `${filters.anio}-${String(filters.mes).padStart(2, "0")}`;
        if (availablePeriods.length > 0 && !periodSet.has(currentPeriod)) {
          const latestPeriod = availablePeriods[availablePeriods.length - 1];
          const [anio, mes] = latestPeriod.split("-");
          updateFilters({ anio: Number(anio), mes: Number(mes) });
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
        setApiConnected(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedSucursalId = filters.id_sucursal ? Number(filters.id_sucursal) : null;
  const selectedPeriodKey = `${filters.anio}-${String(filters.mes).padStart(2, "0")}`;
  const prevPeriod = getPrevPeriod(filters.anio, filters.mes);

  const scopedVentas = useMemo(
    () => (selectedSucursalId ? ventas.filter((x) => x.id_sucursal === selectedSucursalId) : ventas),
    [ventas, selectedSucursalId]
  );
  const scopedGastos = useMemo(
    () => (selectedSucursalId ? gastos.filter((x) => x.id_sucursal === selectedSucursalId) : gastos),
    [gastos, selectedSucursalId]
  );
  const scopedMetas = useMemo(
    () => (selectedSucursalId ? metas.filter((x) => x.id_sucursal === selectedSucursalId) : metas),
    [metas, selectedSucursalId]
  );

  const periodVentas = useMemo(
    () => scopedVentas.filter((x) => monthKey(x.fecha) === selectedPeriodKey),
    [scopedVentas, selectedPeriodKey]
  );
  const prevPeriodVentas = useMemo(
    () => scopedVentas.filter((x) => monthKey(x.fecha) === prevPeriod.key),
    [scopedVentas, prevPeriod.key]
  );
  const periodGastos = useMemo(
    () => scopedGastos.filter((x) => monthKey(x.fecha) === selectedPeriodKey),
    [scopedGastos, selectedPeriodKey]
  );
  const periodMetas = useMemo(
    () => scopedMetas.filter((x) => Number(x.anio) === Number(filters.anio) && Number(x.mes) === Number(filters.mes)),
    [scopedMetas, filters.anio, filters.mes]
  );

  const totalVentasPeriodo = periodVentas.reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
  const totalVentasPrevio = prevPeriodVentas.reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
  const totalGastosPeriodo = periodGastos.reduce((acc, x) => acc + Number(x.monto || 0), 0);
  const totalMetaPeriodo = periodMetas.reduce((acc, x) => acc + Number(x.valor_objetivo || 0), 0);
  const utilidadPeriodo = totalVentasPeriodo - totalGastosPeriodo;
  const cumplimientoPct = totalMetaPeriodo === 0 ? 0 : (totalVentasPeriodo / totalMetaPeriodo) * 100;
  const estado = getEstado(cumplimientoPct);
  const variacionVentas = totalVentasPrevio === 0 ? null : ((totalVentasPeriodo - totalVentasPrevio) / totalVentasPrevio) * 100;

  const trendData = useMemo(() => {
    const map = new Map();
    for (const item of scopedVentas) {
      const key = monthKey(item.fecha);
      map.set(key, (map.get(key) || 0) + Number(item.monto_total || 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([periodo, total]) => ({ periodo, total }));
  }, [scopedVentas]);

  const gastosPorCategoria = useMemo(() => {
    const map = new Map();
    for (const item of periodGastos) {
      const key = item.categoria || "Sin categoria";
      map.set(key, (map.get(key) || 0) + Number(item.monto || 0));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodGastos]);

  const compareBySucursal = useMemo(() => {
    const targetSucursales = selectedSucursalId
      ? sucursales.filter((x) => x.id === selectedSucursalId)
      : sucursales;

    return targetSucursales.map((sucursal) => {
      const ventasSucursal = ventas
        .filter((x) => x.id_sucursal === sucursal.id && monthKey(x.fecha) === selectedPeriodKey)
        .reduce((acc, x) => acc + Number(x.monto_total || 0), 0);

      const gastosSucursal = gastos
        .filter((x) => x.id_sucursal === sucursal.id && monthKey(x.fecha) === selectedPeriodKey)
        .reduce((acc, x) => acc + Number(x.monto || 0), 0);

      const metaSucursal = metas
        .filter((x) => x.id_sucursal === sucursal.id && Number(x.anio) === Number(filters.anio) && Number(x.mes) === Number(filters.mes))
        .reduce((acc, x) => acc + Number(x.valor_objetivo || 0), 0);

      const cumplimiento = metaSucursal === 0 ? 0 : (ventasSucursal / metaSucursal) * 100;

      return {
        id_sucursal: sucursal.id,
        sucursal: sucursal.nombre,
        ventas: ventasSucursal,
        gastos: gastosSucursal,
        utilidad: ventasSucursal - gastosSucursal,
        meta: metaSucursal,
        cumplimiento_pct: Number(cumplimiento.toFixed(2)),
        estado: getEstado(cumplimiento),
      };
    });
  }, [selectedSucursalId, sucursales, ventas, gastos, metas, selectedPeriodKey, filters.anio, filters.mes]);

  const alerts = useMemo(() => {
    const list = [];
    if (estado === "rojo") list.push("Cumplimiento de meta en estado Critica (<80%).");
    if (estado === "amarillo") list.push("Cumplimiento de meta En riesgo (80%-99%).");
    if (utilidadPeriodo < 0) list.push("La utilidad del periodo es negativa.");
    if (variacionVentas !== null && variacionVentas < 0) list.push("Las ventas bajaron respecto al periodo anterior.");
    if (compareBySucursal.some((x) => x.cumplimiento_pct < 80)) list.push("Hay sucursales por debajo de 80% de cumplimiento.");
    return list;
  }, [estado, utilidadPeriodo, variacionVentas, compareBySucursal]);

  const latest5Categories = gastosPorCategoria.slice(0, 5);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileSidebarOpen(false);
  };

  return (
    <main className="min-h-screen bg-slate-100/80">
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Cerrar menu"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-72 transform bg-eis-navy p-5 text-white shadow-soft transition-transform lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.png"
                alt="Logo Sistema EIS"
                className="h-14 w-14 rounded-lg border border-cyan-200/20 bg-white/10 p-1 object-contain"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Sistema EIS</p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight">Panel Ejecutivo</h1>
              </div>
            </div>
            <button
              className="rounded-md border border-white/20 px-2 py-1 text-xs"
              onClick={() => setMobileSidebarOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <nav className="space-y-2 text-sm">
            {SECTION_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`w-full rounded-lg px-3 py-2 text-left ${
                  activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90"
                }`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="mx-auto flex max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="hidden w-72 flex-col justify-between rounded-2xl bg-eis-navy p-5 text-white shadow-soft lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.png"
                alt="Logo Sistema EIS"
                className="h-14 w-14 rounded-lg border border-cyan-200/20 bg-white/10 p-1 object-contain"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Sistema EIS</p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight">Panel Ejecutivo</h1>
              </div>
            </div>

            <nav className="space-y-2 text-sm">
              {SECTION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-lg px-3 py-2 text-left ${
                    activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90"
                  }`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-cyan-50">
            <p className="font-semibold">Contexto actual</p>
            <p className="mt-1">Mes: {filters.mes}</p>
            <p>Año: {filters.anio}</p>
            <p>Sucursal: {filters.id_sucursal || "Todas"}</p>
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          <header className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur">
            <div>
              <button
                className="mb-2 rounded-lg bg-eis-navy px-3 py-2 text-xs font-medium text-white lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                Menu
              </button>
              <h2 className="text-2xl font-semibold text-eis-navy">Dashboard EIS</h2>
              <p className="text-sm text-slate-500">
                Analisis ejecutivo con los datos disponibles en la base actual.
              </p>
              <p className="text-xs text-slate-400">
                Ultima actualizacion: {lastUpdated ? lastUpdated.toLocaleString("es-HN") : "Sin datos aun"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ApiStatusIndicator connected={apiConnected} />
              <button
                className="rounded-lg bg-eis-navy px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                onClick={logout}
              >
                Cerrar sesion
              </button>
            </div>
          </header>

          <FiltersBar sucursales={sucursales} />
          {error ? <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">{error}</p> : null}

          <section id="resumen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 scroll-mt-28">
            <KpiCard title="Ingreso del periodo" value={money(totalVentasPeriodo)} />
            <KpiCard title="Gasto del periodo" value={money(totalGastosPeriodo)} />
            <KpiCard title="Utilidad del periodo" value={money(utilidadPeriodo)} />
            <KpiCard
              title="Cumplimiento de meta"
              value={`${cumplimientoPct.toFixed(2)}%`}
              subtitle={`Estado: ${getEstadoLabel(estado)}`}
            />
          </section>

          <section id="tendencia" className="scroll-mt-28">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-1 text-lg font-semibold text-eis-navy">Tendencia de ventas</h3>
              <p className="mb-3 text-xs text-slate-500">
                Variacion vs periodo anterior:{" "}
                {variacionVentas === null ? "N/A" : `${variacionVentas.toFixed(2)}%`}
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip formatter={(value) => money(value)} />
                    <Line type="monotone" dataKey="total" stroke="#0b1d3a" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section id="comparativo" className="scroll-mt-28">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-lg font-semibold text-eis-navy">Real vs Meta por sucursal</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareBySucursal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="sucursal" />
                    <YAxis />
                    <Tooltip formatter={(value) => money(value)} />
                    <Legend />
                    <Bar dataKey="ventas" fill="#0b1d3a" name="Ventas" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="meta" fill="#22d3ee" name="Meta" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section id="gastos" className="grid gap-4 xl:grid-cols-2 scroll-mt-28">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-lg font-semibold text-eis-navy">Distribucion de gastos</h3>
              <div className="h-72">
                {gastosPorCategoria.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">No hay gastos para el periodo seleccionado.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gastosPorCategoria} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105}>
                        {gastosPorCategoria.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {gastosPorCategoria.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-eis-navy">{money(item.value)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-lg font-semibold text-eis-navy">Top categorias de gasto</h3>
              <div className="space-y-2">
                {latest5Categories.length === 0 ? (
                  <div className="flex h-72 items-center justify-center rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">No hay gastos para el periodo seleccionado.</p>
                  </div>
                ) : (
                  latest5Categories.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <span className="text-sm text-slate-700">
                        {index + 1}. {item.name}
                      </span>
                      <span className="text-sm font-semibold text-eis-navy">{money(item.value)}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <section id="alertas" className="scroll-mt-28">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-lg font-semibold text-eis-navy">Alertas ejecutivas</h3>
              {alerts.length === 0 ? (
                <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  Sin alertas criticas para este periodo.
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((item) => (
                    <p key={item} className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section id="detalle" className="scroll-mt-28">
            <article className="overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-lg font-semibold text-eis-navy">Detalle por sucursal</h3>
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2">Sucursal</th>
                    <th className="py-2">Ventas</th>
                    <th className="py-2">Gastos</th>
                    <th className="py-2">Utilidad</th>
                    <th className="py-2">Meta</th>
                    <th className="py-2">Cumplimiento</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {compareBySucursal.map((row) => (
                    <tr key={row.id_sucursal} className="border-b border-slate-100">
                      <td className="py-2 pr-2">{row.sucursal}</td>
                      <td className="py-2 pr-2">{money(row.ventas)}</td>
                      <td className="py-2 pr-2">{money(row.gastos)}</td>
                      <td className="py-2 pr-2">{money(row.utilidad)}</td>
                      <td className="py-2 pr-2">{money(row.meta)}</td>
                      <td className="py-2 pr-2">{row.cumplimiento_pct}%</td>
                      <td className="py-2 pr-2">
                        <EstadoChip estado={row.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}
