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

export function FiltersBar({ sucursales }) {
  const { filters, updateFilters } = useFilters();

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  return (
    <section className="grid gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-soft md:grid-cols-3">
      <label className="text-sm text-slate-600">
        Mes
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
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

      <label className="text-sm text-slate-600">
        Año
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
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

      <label className="text-sm text-slate-600">
        Sucursal
        <select
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
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
    </section>
  );
}
