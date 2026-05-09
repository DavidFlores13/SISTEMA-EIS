import { createContext, useContext, useMemo, useState } from "react";

const now = new Date();

const FiltersContext = createContext(null);

export function FiltersProvider({ children }) {
  const [filters, setFilters] = useState({
    mes: now.getMonth() + 1,
    anio: now.getFullYear(),
    id_sucursal: "",
  });

  const updateFilters = (next) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const value = useMemo(() => ({ filters, updateFilters }), [filters]);

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters debe usarse dentro de FiltersProvider");
  }
  return context;
}
