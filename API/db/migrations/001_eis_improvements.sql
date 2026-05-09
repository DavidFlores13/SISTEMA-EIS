CREATE INDEX IF NOT EXISTS idx_ventas_fecha_sucursal
ON resumen_ventas(fecha, id_sucursal);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha_sucursal
ON gastos_operativos(fecha, id_sucursal);

CREATE INDEX IF NOT EXISTS idx_metas_periodo_sucursal
ON metas_empresariales(anio, mes, id_sucursal);

CREATE TABLE IF NOT EXISTS recursos_humanos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_empleados INTEGER NOT NULL DEFAULT 0,
  indice_rotacion REAL NOT NULL DEFAULT 0,
  costo_nomina REAL NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  id_sucursal INTEGER NOT NULL,
  UNIQUE(anio, mes, id_sucursal),
  FOREIGN KEY(id_sucursal) REFERENCES sucursales(id)
);

CREATE TABLE IF NOT EXISTS clientes_nuevos_mensual (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cantidad INTEGER NOT NULL DEFAULT 0,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  id_sucursal INTEGER NOT NULL,
  UNIQUE(anio, mes, id_sucursal),
  FOREIGN KEY(id_sucursal) REFERENCES sucursales(id)
);

CREATE TRIGGER IF NOT EXISTS trg_metas_mes_insert
BEFORE INSERT ON metas_empresariales
FOR EACH ROW
WHEN NEW.mes < 1 OR NEW.mes > 12
BEGIN
  SELECT RAISE(ABORT, 'mes fuera de rango (1-12)');
END;

CREATE TRIGGER IF NOT EXISTS trg_metas_mes_update
BEFORE UPDATE ON metas_empresariales
FOR EACH ROW
WHEN NEW.mes < 1 OR NEW.mes > 12
BEGIN
  SELECT RAISE(ABORT, 'mes fuera de rango (1-12)');
END;

CREATE TRIGGER IF NOT EXISTS trg_ventas_no_negativo_insert
BEFORE INSERT ON resumen_ventas
FOR EACH ROW
WHEN NEW.monto_total < 0 OR NEW.cantidad_transacciones < 0
BEGIN
  SELECT RAISE(ABORT, 'ventas no permite negativos');
END;

CREATE TRIGGER IF NOT EXISTS trg_gastos_no_negativo_insert
BEFORE INSERT ON gastos_operativos
FOR EACH ROW
WHEN NEW.monto < 0
BEGIN
  SELECT RAISE(ABORT, 'gastos no permite negativos');
END;

CREATE TRIGGER IF NOT EXISTS trg_rh_validaciones_insert
BEFORE INSERT ON recursos_humanos
FOR EACH ROW
WHEN NEW.total_empleados < 0 OR NEW.indice_rotacion < 0 OR NEW.costo_nomina < 0 OR NEW.mes < 1 OR NEW.mes > 12
BEGIN
  SELECT RAISE(ABORT, 'recursos_humanos con valores invalidos');
END;

CREATE TRIGGER IF NOT EXISTS trg_clientes_validaciones_insert
BEFORE INSERT ON clientes_nuevos_mensual
FOR EACH ROW
WHEN NEW.cantidad < 0 OR NEW.mes < 1 OR NEW.mes > 12
BEGIN
  SELECT RAISE(ABORT, 'clientes_nuevos_mensual con valores invalidos');
END;
