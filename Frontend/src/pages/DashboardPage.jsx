
import { useEffect, useMemo, useRef, useState } from "react";
import { utils as xlsxUtils, writeFile as writeXlsxFile } from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
import { NeonMoney } from "../components/NeonMoney";

const PIE_COLORS = ["#0b1d3a", "#22d3ee", "#2dd42d", "#0ea5e9", "#b8b514", "#1d4ed8"];
const SECTION_ITEMS = [
  { id: "resumen", label: "Resumen" },
  { id: "ranking", label: "Top sucursales" },
  { id: "alertas", label: "Alertas" },
  { id: "tendencia", label: "Tendencia" },
  { id: "comparativo", label: "Comparativa metas vs real" },
  { id: "utilidad", label: "Utilidad mensual" },
  { id: "periodos", label: "Comparativa de utilidad" },
  { id: "gastos", label: "Gastos" },
  { id: "exportar", label: "Exportar datos" },
  { id: "detalle", label: "Detalle por sucursal" },
];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
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

function getPeriodKeys(anio, mes, range) {
  const out = [];
  const cursor = new Date(anio, mes - 1, 1);
  for (let i = 0; i < range; i += 1) {
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return out;
}

function getPreviousPeriodKeys(anio, mes, range) {
  const out = [];
  const cursor = new Date(anio, mes - 1, 1);
  cursor.setMonth(cursor.getMonth() - range);
  for (let i = 0; i < range; i += 1) {
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return out;
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

function trendArrow(value) {
  if (value > 0) return "↑";
  if (value < 0) return "↓";
  return "→";
}

function diffTextTone(value) {
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-red-700";
  return "text-slate-600";
}

function ApiStatusIndicator({ connected }) {
  const isConnected = connected === true;
  const isUnknown = connected === null;

  return (
    <div
      className={`flex items-center rounded-full border p-1 ${
        isUnknown
          ? "border-slate-300 bg-slate-100 text-slate-600"
          : isConnected
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-red-300 bg-red-50 text-red-700"
      }`}
      title={isUnknown ? "Verificando API" : isConnected ? "API conectada" : "API desconectada"}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
          isUnknown ? "bg-slate-300 text-white" : isConnected ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {isUnknown ? "..." : isConnected ? "✓" : "X"}
      </span>
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

  return <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${tone}`}>{getEstadoLabel(estado)}</span>;
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const { filters, updateFilters } = useFilters();
  const selectedSucursalId = filters.id_sucursal ? Number(filters.id_sucursal) : null;

  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [metas, setMetas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [error, setError] = useState("");
  const [apiConnected, setApiConnected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("resumen");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [latestPeriod, setLatestPeriod] = useState(null);
  const [toast, setToast] = useState(null);
  const [topFiltersOpen, setTopFiltersOpen] = useState(false);

  const [trendMode, setTrendMode] = useState(() => {
    try {
      const raw = localStorage.getItem("eis_dashboard_prefs_v1");
      if (!raw) return "historico";
      const saved = JSON.parse(raw);
      return saved.trendMode === "filtrado" ? "filtrado" : "historico";
    } catch {
      return "historico";
    }
  });

  const [utilidadMode, setUtilidadMode] = useState(() => {
    try {
      const raw = localStorage.getItem("eis_dashboard_prefs_v1");
      if (!raw) return "historico";
      const saved = JSON.parse(raw);
      return saved.utilidadMode === "filtrado" ? "filtrado" : "historico";
    } catch {
      return "historico";
    }
  });

  const [reloadTick, setReloadTick] = useState(0);
  const [exportFormat, setExportFormat] = useState("csv");
  const [detalleSearch, setDetalleSearch] = useState("");
  const [detalleSort, setDetalleSort] = useState({ key: "cumplimiento_pct", dir: "desc" });

  const scrollLockRef = useRef(false);
  const scrollLockTimerRef = useRef(null);

  const DASHBOARD_PREFS_KEY = "eis_dashboard_prefs_v1";

  const sectionItems = useMemo(
    () =>
      selectedSucursalId
        ? SECTION_ITEMS.filter((item) => item.id !== "ranking")
        : SECTION_ITEMS,
    [selectedSucursalId]
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        DASHBOARD_PREFS_KEY,
        JSON.stringify({
          trendMode,
          utilidadMode,
        })
      );
    } catch {
      // ignore
    }
  }, [trendMode, utilidadMode]);

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
  }, [reloadTick]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    function onBackToTopVisibility() {
      setShowBackToTop(window.scrollY > 500);
    }

    window.addEventListener("scroll", onBackToTopVisibility);
    onBackToTopVisibility();
    return () => window.removeEventListener("scroll", onBackToTopVisibility);
  }, []);

  useEffect(() => {
    function onScroll() {
      if (scrollLockRef.current) return;
      let current = sectionItems[0]?.id || "resumen";
      const scrollMarker = window.scrollY + 150;
      const sections = sectionItems
        .map((section) => {
          const el = document.getElementById(section.id);
          return el ? { id: section.id, top: el.offsetTop } : null;
        })
        .filter(Boolean);

      for (let i = 0; i < sections.length; i += 1) {
        const thisTop = sections[i].top;
        const nextTop = sections[i + 1]?.top ?? Number.POSITIVE_INFINITY;
        if (scrollMarker >= thisTop && scrollMarker < nextTop) {
          current = sections[i].id;
          break;
        }
      }

      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (isAtBottom) {
        current = sectionItems[sectionItems.length - 1]?.id || current;
      }

      setActiveSection(current);
    }

    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionItems]);

  useEffect(
    () => () => {
      if (scrollLockTimerRef.current) clearTimeout(scrollLockTimerRef.current);
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
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

        const periodSet = new Set();
        ventasData.forEach((item) => periodSet.add(monthKey(item.fecha)));
        gastosData.forEach((item) => periodSet.add(monthKey(item.fecha)));
        metasData.forEach((item) => periodSet.add(`${item.anio}-${String(item.mes).padStart(2, "0")}`));

        const availablePeriods = Array.from(periodSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
        const currentPeriod = `${filters.anio}-${String(filters.mes).padStart(2, "0")}`;
        if (availablePeriods.length > 0 && !periodSet.has(currentPeriod)) {
          const latest = availablePeriods[availablePeriods.length - 1];
          const [anio, mes] = latest.split("-");
          updateFilters({ anio: Number(anio), mes: Number(mes) });
        }
        if (availablePeriods.length > 0) {
          setLatestPeriod(availablePeriods[availablePeriods.length - 1]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err.message);
        setApiConnected(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRange = Number(filters.rango_meses || 1);
  const activePeriodKeys = getPeriodKeys(filters.anio, filters.mes, selectedRange);
  const activePeriodSet = useMemo(() => new Set(activePeriodKeys), [activePeriodKeys]);
  const previousRangeKeys = getPreviousPeriodKeys(filters.anio, filters.mes, selectedRange);
  const previousRangeSet = useMemo(() => new Set(previousRangeKeys), [previousRangeKeys]);
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
    () => scopedVentas.filter((x) => activePeriodSet.has(monthKey(x.fecha))),
    [scopedVentas, activePeriodSet]
  );
  const prevPeriodVentas = useMemo(
    () => scopedVentas.filter((x) => monthKey(x.fecha) === prevPeriod.key),
    [scopedVentas, prevPeriod.key]
  );
  const prevRangeVentas = useMemo(
    () => scopedVentas.filter((x) => previousRangeSet.has(monthKey(x.fecha))),
    [scopedVentas, previousRangeSet]
  );

  const periodGastos = useMemo(
    () => scopedGastos.filter((x) => activePeriodSet.has(monthKey(x.fecha))),
    [scopedGastos, activePeriodSet]
  );

  const periodMetas = useMemo(
    () =>
      scopedMetas.filter((x) =>
        activePeriodSet.has(`${x.anio}-${String(x.mes).padStart(2, "0")}`)
      ),
    [scopedMetas, activePeriodSet]
  );

  const prevRangeGastos = useMemo(
    () => scopedGastos.filter((x) => previousRangeSet.has(monthKey(x.fecha))),
    [scopedGastos, previousRangeSet]
  );
  const prevRangeMetas = useMemo(
    () =>
      scopedMetas.filter((x) =>
        previousRangeSet.has(`${x.anio}-${String(x.mes).padStart(2, "0")}`)
      ),
    [scopedMetas, previousRangeSet]
  );

  const hasNoDataForSelection =
    !loading && !error && periodVentas.length === 0 && periodGastos.length === 0 && periodMetas.length === 0;

  const totalVentasPeriodo = periodVentas.reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
  const totalVentasPrevio = prevPeriodVentas.reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
  const totalVentasPrevioRango = prevRangeVentas.reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
  const totalTransaccionesPeriodo = periodVentas.reduce((acc, x) => acc + Number(x.cantidad_transacciones || 0), 0);
  const totalTransaccionesPrevio = prevPeriodVentas.reduce((acc, x) => acc + Number(x.cantidad_transacciones || 0), 0);
  const totalGastosPeriodo = periodGastos.reduce((acc, x) => acc + Number(x.monto || 0), 0);
  const totalMetaPeriodo = periodMetas.reduce((acc, x) => acc + Number(x.valor_objetivo || 0), 0);
  const totalGastosPrevioRango = prevRangeGastos.reduce((acc, x) => acc + Number(x.monto || 0), 0);
  const totalMetaPrevioRango = prevRangeMetas.reduce((acc, x) => acc + Number(x.valor_objetivo || 0), 0);

  const utilidadPeriodo = totalVentasPeriodo - totalGastosPeriodo;
  const utilidadPreviaRango = totalVentasPrevioRango - totalGastosPrevioRango;

  const cumplimientoPct = totalMetaPeriodo === 0 ? 0 : (totalVentasPeriodo / totalMetaPeriodo) * 100;
  const cumplimientoPctPrevio = totalMetaPrevioRango === 0 ? 0 : (totalVentasPrevioRango / totalMetaPrevioRango) * 100;
  const estado = getEstado(cumplimientoPct);

  const variacionVentas = totalVentasPrevio === 0 ? null : ((totalVentasPeriodo - totalVentasPrevio) / totalVentasPrevio) * 100;
  const variacionTransacciones = totalTransaccionesPrevio === 0 ? null : ((totalTransaccionesPeriodo - totalTransaccionesPrevio) / totalTransaccionesPrevio) * 100;
  const ticketPromedioPeriodo = totalTransaccionesPeriodo === 0 ? 0 : totalVentasPeriodo / totalTransaccionesPeriodo;
  const ticketPromedioPrevio = totalTransaccionesPrevio === 0 ? 0 : totalVentasPrevio / totalTransaccionesPrevio;
  const variacionTicketPromedio = ticketPromedioPrevio === 0 ? null : ((ticketPromedioPeriodo - ticketPromedioPrevio) / ticketPromedioPrevio) * 100;

  const diferenciaPeriodoAnterior = totalVentasPeriodo - totalVentasPrevioRango;
  const diferenciaPctPeriodoAnterior = totalVentasPrevioRango === 0 ? null : (diferenciaPeriodoAnterior / totalVentasPrevioRango) * 100;

  const diferenciaGastos = totalGastosPeriodo - totalGastosPrevioRango;
  const diferenciaGastosPct = totalGastosPrevioRango === 0 ? null : (diferenciaGastos / totalGastosPrevioRango) * 100;

  const diferenciaUtilidad = utilidadPeriodo - utilidadPreviaRango;
  const diferenciaUtilidadPct = utilidadPreviaRango === 0 ? null : (diferenciaUtilidad / utilidadPreviaRango) * 100;

  const diferenciaCumplimiento = cumplimientoPct - cumplimientoPctPrevio;

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

  const trendDataFiltered = useMemo(() => {
    const map = new Map();
    for (const item of scopedVentas) {
      const key = monthKey(item.fecha);
      map.set(key, (map.get(key) || 0) + Number(item.monto_total || 0));
    }

    const keys = Array.from(new Set([...activePeriodKeys, prevPeriod.key])).sort((a, b) => a.localeCompare(b));
    return keys.map((periodo) => ({ periodo, total: map.get(periodo) || 0 }));
  }, [scopedVentas, activePeriodKeys, prevPeriod.key]);

  const activeTrendData = trendMode === "historico" ? trendData : trendDataFiltered;

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
        .filter((x) => x.id_sucursal === sucursal.id && activePeriodSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto_total || 0), 0);

      const gastosSucursal = gastos
        .filter((x) => x.id_sucursal === sucursal.id && activePeriodSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto || 0), 0);

      const metaSucursal = metas
        .filter(
          (x) => x.id_sucursal === sucursal.id && activePeriodSet.has(`${x.anio}-${String(x.mes).padStart(2, "0")}`)
        )
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
  }, [selectedSucursalId, sucursales, ventas, gastos, metas, activePeriodSet]);

  const hasComparativoData = compareBySucursal.some((row) => row.ventas > 0 || row.meta > 0 || row.gastos > 0);

  const compareVsAnteriorBySucursal = useMemo(() => {
    const targetSucursales = selectedSucursalId
      ? sucursales.filter((x) => x.id === selectedSucursalId)
      : sucursales;

    return targetSucursales.map((sucursal) => {
      const actualVentas = ventas
        .filter((x) => x.id_sucursal === sucursal.id && activePeriodSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
      const actualGastos = gastos
        .filter((x) => x.id_sucursal === sucursal.id && activePeriodSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto || 0), 0);

      const anteriorVentas = ventas
        .filter((x) => x.id_sucursal === sucursal.id && previousRangeSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto_total || 0), 0);
      const anteriorGastos = gastos
        .filter((x) => x.id_sucursal === sucursal.id && previousRangeSet.has(monthKey(x.fecha)))
        .reduce((acc, x) => acc + Number(x.monto || 0), 0);

      const actualUtilidad = actualVentas - actualGastos;
      const anteriorUtilidad = anteriorVentas - anteriorGastos;
      const diff = actualUtilidad - anteriorUtilidad;
      const diffPct = anteriorUtilidad === 0 ? null : (diff / anteriorUtilidad) * 100;

      return {
        id_sucursal: sucursal.id,
        sucursal: sucursal.nombre,
        actual_utilidad: actualUtilidad,
        anterior_utilidad: anteriorUtilidad,
        diff_utilidad: diff,
        diff_pct: diffPct,
      };
    });
  }, [selectedSucursalId, sucursales, ventas, gastos, activePeriodSet, previousRangeSet]);

  const rankingSucursales = useMemo(() => {
    const prevById = new Map(compareVsAnteriorBySucursal.map((row) => [row.id_sucursal, row]));
    return [...compareBySucursal]
      .map((row) => {
        const prev = prevById.get(row.id_sucursal);
        return {
          ...row,
          diff_utilidad: prev?.diff_utilidad ?? 0,
          diff_pct: prev?.diff_pct ?? null,
        };
      })
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, 5);
  }, [compareBySucursal, compareVsAnteriorBySucursal]);

  const utilidadMensualData = useMemo(() => {
    const mapVentas = new Map();
    const mapGastos = new Map();

    for (const item of scopedVentas) {
      const key = monthKey(item.fecha);
      mapVentas.set(key, (mapVentas.get(key) || 0) + Number(item.monto_total || 0));
    }

    for (const item of scopedGastos) {
      const key = monthKey(item.fecha);
      mapGastos.set(key, (mapGastos.get(key) || 0) + Number(item.monto || 0));
    }

    const keys = Array.from(new Set([...mapVentas.keys(), ...mapGastos.keys()])).sort((a, b) => a.localeCompare(b));

    return keys.map((k) => ({
      periodo: k,
      utilidad: (mapVentas.get(k) || 0) - (mapGastos.get(k) || 0),
    }));
  }, [scopedVentas, scopedGastos]);

  const utilidadMensualDataFiltered = useMemo(() => {
    const mapVentas = new Map();
    const mapGastos = new Map();

    for (const item of scopedVentas) {
      const key = monthKey(item.fecha);
      mapVentas.set(key, (mapVentas.get(key) || 0) + Number(item.monto_total || 0));
    }

    for (const item of scopedGastos) {
      const key = monthKey(item.fecha);
      mapGastos.set(key, (mapGastos.get(key) || 0) + Number(item.monto || 0));
    }

    const keys = Array.from(new Set([...activePeriodKeys, prevPeriod.key])).sort((a, b) => a.localeCompare(b));

    return keys.map((k) => ({
      periodo: k,
      utilidad: (mapVentas.get(k) || 0) - (mapGastos.get(k) || 0),
    }));
  }, [scopedVentas, scopedGastos, activePeriodKeys, prevPeriod.key]);

  const activeUtilidadData = utilidadMode === "historico" ? utilidadMensualData : utilidadMensualDataFiltered;

  const alerts = useMemo(() => {
    const list = [];
    if (estado === "rojo") {
      list.push({ id: "a1", text: "Cumplimiento de meta en estado Critica (<80%).", target: "resumen", actionable: false });
    }
    if (estado === "amarillo") {
      list.push({ id: "a2", text: "Cumplimiento de meta En riesgo (80%-99%).", target: "resumen", actionable: false });
    }
    if (utilidadPeriodo < 0) {
      list.push({ id: "a3", text: "La utilidad del periodo es negativa.", target: "periodos", actionable: true });
    }
    if (variacionVentas !== null && variacionVentas < 0) {
      list.push({ id: "a4", text: "Las ventas bajaron respecto al periodo anterior.", target: "tendencia", actionable: true });
    }
    if (compareBySucursal.some((x) => x.cumplimiento_pct < 80)) {
      list.push({ id: "a5", text: "Hay sucursales por debajo de 80% de cumplimiento.", target: "detalle", actionable: true });
    }
    return list;
  }, [estado, utilidadPeriodo, variacionVentas, compareBySucursal]);

  const latest5Categories = gastosPorCategoria.slice(0, 5);
  const selectedSucursalName = selectedSucursalId
    ? sucursales.find((s) => s.id === selectedSucursalId)?.nombre || `Sucursal ${selectedSucursalId}`
    : "Todas";
  const selectedMonthName = MONTH_NAMES[(filters.mes || 1) - 1] || `Mes ${filters.mes}`;
  const selectedRangeLabel = Number(filters.rango_meses || 1) === 1 ? "Mes actual" : `Ultimos ${Number(filters.rango_meses || 1)} meses`;

  const filteredSortedDetalleRows = useMemo(() => {
    const query = detalleSearch.trim().toLowerCase();
    const filtered = compareBySucursal.filter((row) => row.sucursal.toLowerCase().includes(query));

    return [...filtered].sort((a, b) => {
      const { key, dir } = detalleSort;
      const factor = dir === "asc" ? 1 : -1;
      const va = a[key];
      const vb = b[key];
      if (typeof va === "string" || typeof vb === "string") {
        return String(va).localeCompare(String(vb)) * factor;
      }
      return (Number(va) - Number(vb)) * factor;
    });
  }, [compareBySucursal, detalleSearch, detalleSort]);

  const sortIndicator = (key) => {
    if (detalleSort.key !== key) return "";
    return detalleSort.dir === "asc" ? " ↑" : " ↓";
  };

  const toggleDetalleSort = (key) => {
    setDetalleSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "desc" };
    });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const topHeader = document.querySelector("section.flex-1 > header");
    const headerOffset = topHeader ? topHeader.getBoundingClientRect().height + 10 : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    scrollLockRef.current = true;
    if (scrollLockTimerRef.current) clearTimeout(scrollLockTimerRef.current);
    setActiveSection(id);
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    setMobileSidebarOpen(false);
    scrollLockTimerRef.current = setTimeout(() => {
      scrollLockRef.current = false;
    }, 700);
  };

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileSidebarOpen(false);
  };

  const refreshDashboardData = () => {
    setReloadTick((prev) => prev + 1);
    setToast({ type: "success", message: "Actualizando datos..." });
  };

  const resetFilters = () => {
    if (latestPeriod) {
      const [anio, mes] = latestPeriod.split("-");
      updateFilters({ anio: Number(anio), mes: Number(mes), id_sucursal: "", rango_meses: 1 });
      return;
    }
    const now = new Date();
    updateFilters({ anio: now.getFullYear(), mes: now.getMonth() + 1, id_sucursal: "", rango_meses: 1 });
  };

  const toneFromDiff = (diff) => {
    if (diff > 0) return "up";
    if (diff < 0) return "down";
    return "neutral";
  };

  const exportData = (prefix, header, rows) => {
    const baseFilename = `${prefix}_${filters.anio}_${String(filters.mes).padStart(2, "0")}_r${selectedRange}`;
    if (exportFormat === "xlsx") {
      exportXlsx(baseFilename, rows);
      return;
    }
    if (exportFormat === "pdf") {
      exportPdf(baseFilename, header, rows);
      return;
    }
    exportCsv(baseFilename, header, rows);
  };

  const exportCsv = (baseFilename, header, rows) => {
    try {
      const csv = [header, ...rows.map((r) => header.map((h) => r[h]))]
        .map((cols) => cols.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseFilename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: `CSV descargado: ${baseFilename}.csv` });
    } catch {
      setToast({ type: "error", message: "No se pudo exportar el CSV." });
    }
  };

  const exportXlsx = (baseFilename, rows) => {
    try {
      const worksheet = xlsxUtils.json_to_sheet(rows);
      const workbook = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(workbook, worksheet, "Datos");
      writeXlsxFile(workbook, `${baseFilename}.xlsx`);
      setToast({ type: "success", message: `Excel descargado: ${baseFilename}.xlsx` });
    } catch {
      setToast({ type: "error", message: "No se pudo exportar el Excel." });
    }
  };

  const exportPdf = (baseFilename, header, rows) => {
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(13);
      doc.text("Sistema EIS - Exportacion de datos", 14, 14);
      doc.setFontSize(10);
      doc.text(
        `Periodo: ${selectedMonthName} ${filters.anio} | Rango: ${selectedRangeLabel} | Sucursal: ${selectedSucursalName}`,
        14,
        21
      );
      autoTable(doc, {
        startY: 26,
        head: [header],
        body: rows.map((row) => header.map((h) => row[h] ?? "")),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [11, 29, 58] },
      });
      doc.save(`${baseFilename}.pdf`);
      setToast({ type: "success", message: `PDF descargado: ${baseFilename}.pdf` });
    } catch {
      setToast({ type: "error", message: "No se pudo exportar el PDF." });
    }
  };

  const exportDetalle = () => {
    const header = ["Sucursal", "Ventas", "Gastos", "Utilidad", "Meta", "CumplimientoPct", "Estado"];
    const rows = compareBySucursal.map((row) => ({
      Sucursal: row.sucursal,
      Ventas: row.ventas.toFixed(2),
      Gastos: row.gastos.toFixed(2),
      Utilidad: row.utilidad.toFixed(2),
      Meta: row.meta.toFixed(2),
      CumplimientoPct: row.cumplimiento_pct.toFixed(2),
      Estado: getEstadoLabel(row.estado),
    }));
    exportData("detalle_sucursales", header, rows);
  };

  const exportVentas = () => {
    const header = ["fecha", "id_sucursal", "sucursal", "monto_total", "cantidad_transacciones"];
    const rows = periodVentas.map((v) => ({
      fecha: v.fecha,
      id_sucursal: v.id_sucursal,
      sucursal: sucursales.find((s) => s.id === v.id_sucursal)?.nombre || v.id_sucursal,
      monto_total: Number(v.monto_total || 0).toFixed(2),
      cantidad_transacciones: v.cantidad_transacciones,
    }));
    exportData("ventas", header, rows);
  };

  const exportGastos = () => {
    const header = ["fecha", "id_sucursal", "sucursal", "categoria", "monto"];
    const rows = periodGastos.map((g) => ({
      fecha: g.fecha,
      id_sucursal: g.id_sucursal,
      sucursal: sucursales.find((s) => s.id === g.id_sucursal)?.nombre || g.id_sucursal,
      categoria: g.categoria,
      monto: Number(g.monto || 0).toFixed(2),
    }));
    exportData("gastos", header, rows);
  };

  const exportMetas = () => {
    const header = ["anio", "mes", "id_sucursal", "sucursal", "nombre_kpi", "valor_objetivo"];
    const rows = periodMetas.map((m) => ({
      anio: m.anio,
      mes: m.mes,
      id_sucursal: m.id_sucursal,
      sucursal: sucursales.find((s) => s.id === m.id_sucursal)?.nombre || m.id_sucursal,
      nombre_kpi: m.nombre_kpi,
      valor_objetivo: Number(m.valor_objetivo || 0).toFixed(2),
    }));
    exportData("metas", header, rows);
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Cerrar menu"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-56 transform bg-eis-navy p-3.5 text-white shadow-soft transition-transform lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.png"
                alt="Logo Sistema EIS"
                className="h-10 w-10 rounded-lg border border-cyan-200/20 bg-white/10 p-1 object-contain"
              />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Sistema EIS</p>
                <h1 className="mt-1 text-lg font-semibold leading-tight">Panel Ejecutivo</h1>
              </div>
            </div>
            <button
              className="rounded-md border border-white/20 px-2 py-1 text-xs transition-colors duration-150 hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60"
              onClick={() => setMobileSidebarOpen(false)}
            >
              Cerrar
            </button>
          </div>

          <nav className="space-y-2 text-sm">
            <p className="px-1 pt-1 text-[11px] uppercase tracking-wider text-cyan-200/80">Vision general</p>
            {sectionItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 ${
                  activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90 hover:bg-white/10"
                }`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}

            <p className="px-1 pt-3 text-[11px] uppercase tracking-wider text-cyan-200/80">Operacion</p>
            {sectionItems.slice(3).map((item) => (
              <button
                key={item.id}
                className={`w-full rounded-lg px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 ${
                  activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90 hover:bg-white/10"
                }`}
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex lg:pl-56">
        <aside className="hidden w-56 flex-col bg-eis-navy p-3.5 text-white lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <img
                src="/LOGO.png"
                alt="Logo Sistema EIS"
                className="h-10 w-10 rounded-lg border border-cyan-200/20 bg-white/10 p-1 object-contain"
              />
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Sistema EIS</p>
                <h1 className="mt-1 text-lg font-semibold leading-tight">Panel Ejecutivo</h1>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm">
              <p className="px-1 pt-1 text-[11px] uppercase tracking-wider text-cyan-200/80">Vision general</p>
              {sectionItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 ${
                    activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90 hover:bg-white/10"
                  }`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}

              <p className="px-1 pt-3 text-[11px] uppercase tracking-wider text-cyan-200/80">Operacion</p>
              {sectionItems.slice(3).map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60 ${
                    activeSection === item.id ? "bg-white/15 font-medium" : "text-cyan-100/90 hover:bg-white/10"
                  }`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-cyan-100/90">
            <p className="font-semibold text-cyan-50">Contexto actual</p>
            <p className="mt-1">Mes: {selectedMonthName}</p>
            <p>Año: {filters.anio}</p>
            <p>Sucursal: {selectedSucursalName}</p>
            <p>Rango: {selectedRangeLabel}</p>
          </div>
        </aside>

        <section className="flex-1 p-4 lg:p-5">
          <header className="sticky top-0 z-20 space-y-2 border border-slate-200 bg-white px-4 py-3 lg:fixed lg:left-56 lg:right-0 lg:top-0 lg:z-30 lg:px-5 lg:pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  className="mb-2 rounded-lg bg-eis-navy px-3 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-slate-800 active:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 lg:hidden"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  Menu
                </button>
                <h2 className="text-xl font-semibold text-eis-navy">Centro de Control</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    Actualizado: {lastUpdated ? lastUpdated.toLocaleString("es-HN") : "Sin datos aun"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ApiStatusIndicator connected={apiConnected} />
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={refreshDashboardData}
                  disabled={loading}
                >
                  {loading ? "Actualizando..." : "Actualizar datos"}
                </button>
                <button
                  className="rounded-lg bg-eis-navy px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-800 active:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                  onClick={logout}
                >
                  Cerrar sesion
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2">
              <div className="mb-1 flex items-center justify-end gap-2 md:hidden">
                <button
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 md:hidden"
                  onClick={() => setTopFiltersOpen((prev) => !prev)}
                >
                  {topFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
              </div>
              <div className={`${topFiltersOpen ? "block" : "hidden"} md:block`}>
                <FiltersBar sucursales={sucursales} compact onReset={resetFilters} />
              </div>
            </div>
          </header>

          <div className="space-y-5 pt-5 lg:pt-[8.75rem]">
            {error ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors duration-150 hover:bg-red-100 active:bg-red-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  onClick={() => setReloadTick((prev) => prev + 1)}
                >
                  Reintentar
                </button>
              </div>
            ) : null}

            {hasNoDataForSelection ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  No hay datos para los filtros actuales. Prueba otro mes, sucursal o rango.
                </p>
                <button
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors duration-150 hover:bg-amber-100 active:bg-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  onClick={resetFilters}
                >
                  Restablecer filtros
                </button>
              </div>
            ) : null}

            {/* ===================== RESUMEN ===================== */}
            <section id="resumen" className="scroll-mt-44">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-eis-navy">Resumen ejecutivo</h3>
                <p className="text-sm text-slate-500">KPI principales del periodo seleccionado.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <>
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                    <div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
                  </>
                ) : (
                  <>
                    <KpiCard
                      title="Ingreso del periodo"
                      value={<NeonMoney value={totalVentasPeriodo} prevValue={totalVentasPrevio} />}
                      subtitle={`Dif. vs periodo anterior: ${trendArrow(diferenciaPeriodoAnterior)} ${money(diferenciaPeriodoAnterior)}${
                        diferenciaPctPeriodoAnterior === null ? "" : ` (${diferenciaPctPeriodoAnterior.toFixed(2)}%)`
                      }`}
                      subtitleTone={toneFromDiff(diferenciaPeriodoAnterior)}
                    />
                    <KpiCard
                      title="Gasto del periodo"
                      value={<NeonMoney value={totalGastosPeriodo} prevValue={totalGastosPrevioRango} />}
                      subtitle={`Dif. vs periodo anterior: ${trendArrow(diferenciaGastos)} ${money(diferenciaGastos)}${
                        diferenciaGastosPct === null ? "" : ` (${diferenciaGastosPct.toFixed(2)}%)`
                      }`}
                      subtitleTone={toneFromDiff(diferenciaGastos)}
                    />
                    <KpiCard
                      title="Utilidad del periodo"
                      value={<NeonMoney value={utilidadPeriodo} prevValue={utilidadPreviaRango} />}
                      subtitle={`Dif. vs periodo anterior: ${trendArrow(diferenciaUtilidad)} ${money(diferenciaUtilidad)}${
                        diferenciaUtilidadPct === null ? "" : ` (${diferenciaUtilidadPct.toFixed(2)}%)`
                      }`}
                      subtitleTone={toneFromDiff(diferenciaUtilidad)}
                    />
                    <KpiCard
                      title="Cumplimiento de meta"
                      value={`${cumplimientoPct.toFixed(2)}%`}
                      subtitle={`Estado: ${getEstadoLabel(estado)} | Dif.: ${trendArrow(diferenciaCumplimiento)} ${diferenciaCumplimiento.toFixed(2)}%`}
                      subtitleTone={toneFromDiff(diferenciaCumplimiento)}
                      tone={estado === "verde" ? "success" : estado === "amarillo" ? "warning" : "danger"}
                    />
                    <KpiCard
                      title="Transacciones del periodo"
                      value={totalTransaccionesPeriodo.toLocaleString("es-HN")}
                      subtitle={`Variacion vs periodo anterior: ${variacionTransacciones === null ? "N/A" : `${variacionTransacciones.toFixed(2)}%`}`}
                      subtitleTone={variacionTransacciones === null ? "neutral" : variacionTransacciones >= 0 ? "up" : "down"}
                    />
                    <KpiCard
                      title="Monto promedio por transaccion"
                      value={money(ticketPromedioPeriodo)}
                      subtitle={`Variacion vs periodo anterior: ${variacionTicketPromedio === null ? "N/A" : `${variacionTicketPromedio.toFixed(2)}%`}`}
                      subtitleTone={variacionTicketPromedio === null ? "neutral" : variacionTicketPromedio >= 0 ? "up" : "down"}
                    />
                  </>
                )}
              </div>
            </section>

            {/* ===================== RANKING ===================== */}
            {!selectedSucursalId ? (
              <section id="ranking" className="scroll-mt-44">
                <article className="overflow-auto rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                  <h3 className="mb-3 text-lg font-semibold text-eis-navy">Top sucursales del periodo</h3>
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2">Rank</th>
                        <th className="py-2">Sucursal</th>
                        <th className="py-2">Utilidad</th>
                        <th className="py-2">Cumplimiento</th>
                        <th className="py-2">Dif. utilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingSucursales.map((row, index) => (
                        <tr key={row.id_sucursal} className="border-b border-slate-100">
                          <td className="py-2 pr-2 font-semibold text-eis-navy">#{index + 1}</td>
                          <td className="py-2 pr-2">{row.sucursal}</td>
                          <td className="py-2 pr-2">{money(row.utilidad)}</td>
                          <td className="py-2 pr-2">{row.cumplimiento_pct}%</td>
                          <td className={`py-2 pr-2 font-semibold ${diffTextTone(row.diff_utilidad)}`}>
                            {trendArrow(row.diff_utilidad)} {money(row.diff_utilidad)}
                            {row.diff_pct === null ? "" : ` (${row.diff_pct.toFixed(2)}%)`}
                          </td>
                        </tr>
                      ))}
                      {rankingSucursales.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                            No hay datos para generar ranking en este periodo.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </article>
              </section>
            ) : null}

            {/* ===================== ALERTAS ===================== */}
            <section id="alertas" className="scroll-mt-44">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold text-eis-navy">Alertas ejecutivas</h3>
                {alerts.length === 0 ? (
                  <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Sin alertas criticas para este periodo.</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3">
                        <p className="text-sm text-amber-700">{item.text}</p>
                        {item.actionable ? (
                          <button
                            className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition-colors duration-150 hover:bg-amber-100 active:bg-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                            onClick={() => scrollToSection(item.target)}
                          >
                            Ver detalle
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            {/* ===================== TENDENCIA ===================== */}
            <section id="tendencia" className="scroll-mt-44">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-eis-navy">Tendencia de ventas</h3>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                    <button
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                        trendMode === "historico" ? "bg-eis-navy text-white" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                      onClick={() => setTrendMode("historico")}
                    >
                      Historico
                    </button>
                    <button
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                        trendMode === "filtrado" ? "bg-eis-navy text-white" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                      onClick={() => setTrendMode("filtrado")}
                    >
                      Periodo filtrado
                    </button>
                  </div>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  {trendMode === "historico" ? "Vista historica por sucursal." : "Vista segun filtros de mes/rango."} Variacion vs periodo anterior:{" "}
                  {variacionVentas === null ? "N/A" : `${variacionVentas.toFixed(2)}%`}
                </p>
                {trendMode === "filtrado" && selectedRange === 1 ? (
                  <p className="mb-3 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    En modo filtrado se incluye tambien el mes anterior para mostrar tendencia minima.
                  </p>
                ) : null}
                <div className="h-72">
                  {activeTrendData.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-500">No hay datos para mostrar en este modo de tendencia.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip formatter={(value) => money(value)} />
                        <Line type="monotone" dataKey="total" stroke="#0b1d3a" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </article>
            </section>

            {/* ===================== COMPARATIVO ===================== */}
            <section id="comparativo" className="scroll-mt-44">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold text-eis-navy">Comparativa real vs meta por sucursal</h3>
                <div className="h-72">
                  {hasComparativoData ? (
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
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-50 p-4 text-center">
                      <p className="text-sm text-slate-600">No hay datos para la comparativa en el periodo seleccionado.</p>
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
                        onClick={resetFilters}
                      >
                        Volver al ultimo periodo con datos
                      </button>
                    </div>
                  )}
                </div>
              </article>
            </section>

            {/* ===================== UTILIDAD MENSUAL ===================== */}
            <div className="space-y-1 pt-1">
              <p className="px-1 text-[11px] uppercase tracking-wider text-slate-500">Operacion</p>
              <div className="h-px bg-slate-200" />
            </div>

            <section id="utilidad" className="scroll-mt-44">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-eis-navy">Utilidad mensual</h3>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                    <button
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                        utilidadMode === "historico" ? "bg-eis-navy text-white" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                      onClick={() => setUtilidadMode("historico")}
                    >
                      Historico
                    </button>
                    <button
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 ${
                        utilidadMode === "filtrado" ? "bg-eis-navy text-white" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"
                      }`}
                      onClick={() => setUtilidadMode("filtrado")}
                    >
                      Periodo filtrado
                    </button>
                  </div>
                </div>
                {utilidadMode === "filtrado" && selectedRange === 1 ? (
                  <p className="mb-3 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    En modo filtrado se incluye tambien el mes anterior para mostrar tendencia minima.
                  </p>
                ) : null}
                <div className="h-72">
                  {activeUtilidadData.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-500">No hay datos para mostrar en este modo de utilidad.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeUtilidadData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip formatter={(value) => money(value)} />
                        <Line type="monotone" dataKey="utilidad" stroke="#14b8a6" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </article>
            </section>

            {/* ===================== PERIODOS ===================== */}
            <section id="periodos" className="scroll-mt-44">
              <article className="overflow-auto rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold text-eis-navy">Comparativa de utilidad</h3>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2">Sucursal</th>
                      <th className="py-2">Actual</th>
                      <th className="py-2">Anterior</th>
                      <th className="py-2">Diferencia</th>
                      <th className="py-2">% Dif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareVsAnteriorBySucursal.map((row) => (
                      <tr key={row.id_sucursal} className="border-b border-slate-100">
                        <td className="py-2 pr-2">{row.sucursal}</td>
                        <td className="py-2 pr-2">{money(row.actual_utilidad)}</td>
                        <td className="py-2 pr-2">{money(row.anterior_utilidad)}</td>
                        <td className={`py-2 pr-2 font-semibold ${diffTextTone(row.diff_utilidad)}`}>
                          {trendArrow(row.diff_utilidad)} {money(row.diff_utilidad)}
                        </td>
                        <td className={`py-2 pr-2 font-semibold ${diffTextTone(row.diff_utilidad)}`}>
                          {row.diff_pct === null ? "N/A" : `${trendArrow(row.diff_utilidad)} ${row.diff_pct.toFixed(2)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </section>

            {/* ===================== GASTOS ===================== */}
            <section id="gastos" className="grid gap-4 scroll-mt-44 xl:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <h3 className="mb-3 text-lg font-semibold text-eis-navy">Distribucion de gastos</h3>
                <div className="h-72">
                  {gastosPorCategoria.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-500">No hay gastos para el periodo seleccionado.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={gastosPorCategoria} dataKey="value" nameKey="name" innerRadius={0} outerRadius={105}>
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
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {item.name}
                      </span>
                      <span className="text-xs font-semibold text-eis-navy">{money(item.value)}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
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

            {/* ===================== DETALLE ===================== */}
            <section id="detalle" className="scroll-mt-44">
              <article className="overflow-auto rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-eis-navy">Detalle por sucursal</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={detalleSearch}
                      onChange={(e) => setDetalleSearch(e.target.value)}
                      placeholder="Buscar sucursal..."
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 transition-colors duration-150 outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-100"
                    />
                  </div>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("sucursal")}>Sucursal{sortIndicator("sucursal")}</button>
                      </th>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("ventas")}>Ventas{sortIndicator("ventas")}</button>
                      </th>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("gastos")}>Gastos{sortIndicator("gastos")}</button>
                      </th>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("utilidad")}>Utilidad{sortIndicator("utilidad")}</button>
                      </th>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("meta")}>Meta{sortIndicator("meta")}</button>
                      </th>
                      <th className="py-2">
                        <button className="font-semibold" onClick={() => toggleDetalleSort("cumplimiento_pct")}>Cumplimiento{sortIndicator("cumplimiento_pct")}</button>
                      </th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSortedDetalleRows.map((row) => (
                      <tr key={row.id_sucursal} className="border-b border-slate-100">
                        <td className="py-2 pr-2">{row.sucursal}</td>
                        <td className="py-2 pr-2">{money(row.ventas)}</td>
                        <td className="py-2 pr-2">{money(row.gastos)}</td>
                        <td className="py-2 pr-2">{money(row.utilidad)}</td>
                        <td className="py-2 pr-2">{money(row.meta)}</td>
                        <td className="py-2 pr-2">{row.cumplimiento_pct}%</td>
                        <td className="py-2 pr-2"><EstadoChip estado={row.estado} /></td>
                      </tr>
                    ))}
                    {filteredSortedDetalleRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-sm text-slate-500">No hay sucursales que coincidan con la busqueda.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </article>
            </section>

            {/* ===================== EXPORTAR (DEBAJO DE DETALLE) ===================== */}
            <section id="exportar" className="scroll-mt-44">
              <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-eis-navy">Exportar datos</h3>
                    <p className="text-xs text-slate-500">Selecciona formato y dataset para descargar el archivo.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-100"
                      aria-label="Formato de exportacion"
                    >
                      <option value="csv">CSV</option>
                      <option value="xlsx">Excel</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100" onClick={exportDetalle}>
                      Exportar detalle
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100" onClick={exportVentas}>
                      Exportar ventas
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100" onClick={exportGastos}>
                      Exportar gastos
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100" onClick={exportMetas}>
                      Exportar metas
                    </button>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>

      {showBackToTop ? (
        <button
          className="fixed bottom-6 right-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-eis-navy text-xl font-bold text-white shadow-soft transition-colors duration-150 hover:bg-slate-800 active:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100"
          onClick={goTop}
          aria-label="Volver arriba"
        >
          ↑
        </button>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-soft ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </main>
  );
}

