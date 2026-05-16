import { useMemo } from "react";
import { useFilters } from "../context/FiltersContext";

const months = [
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

export function FiltersBar({ sucursales, compact = false, onReset }) {
  const { filters, updateFilters } = useFilters();

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const wrapperClasses = compact
    ? "grid gap-2 md:grid-cols-[0.75fr_0.75fr_1.25fr_1fr_auto] md:items-end"
    : "grid gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-soft md:grid-cols-4";
  const inputClasses = compact
    ? "w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 transition-colors duration-150 outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-100"
    : "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 transition-colors duration-150 outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-100";
  const labelClasses = "text-sm text-slate-600";

  return (
    <section className={wrapperClasses}>
      <label className={labelClasses}>
        Mes
        <select
          className={inputClasses}
          aria-label="Mes"
          value={filters.mes}
          onChange={(event) => updateFilters({ mes: Number(event.target.value) })}
        >
          {months.map((month, index) => (
            <option key={month} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Año
        <select
          className={inputClasses}
          aria-label="Año"
          value={filters.anio}
          onChange={(event) => updateFilters({ anio: Number(event.target.value) })}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Sucursal
        <select
          className={inputClasses}
          aria-label="Sucursal"
          value={filters.id_sucursal}
          onChange={(event) => updateFilters({ id_sucursal: event.target.value })}
        >
          <option value="">Todas</option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClasses}>
        Rango
        <select
          className={inputClasses}
          aria-label="Rango"
          value={filters.rango_meses}
          onChange={(event) => updateFilters({ rango_meses: Number(event.target.value) })}
        >
          <option value={1}>Mes actual</option>
          <option value={3}>Ultimos 3 meses</option>
          <option value={6}>Ultimos 6 meses</option>
        </select>
      </label>

      {compact && onReset ? (
        <button
          className="justify-self-end rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 md:mb-0.5"
          onClick={onReset}
          type="button"
        >
          Limpiar filtros
        </button>
      ) : null}
    </section>
  );
}
