CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_empresa TEXT NOT NULL,
  rtn TEXT,
  nombre_contacto TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT NOT NULL DEFAULT 'Prospecto'
);

CREATE TABLE IF NOT EXISTS oportunidades_venta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  valor_estimado REAL NOT NULL DEFAULT 0,
  etapa TEXT NOT NULL DEFAULT 'Contacto Inicial',
  fecha_cierre_estimada TEXT,
  fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interacciones_crm (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  tipo_interaccion TEXT NOT NULL,
  comentarios TEXT NOT NULL,
  fecha_interaccion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente ON oportunidades_venta(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones_crm(cliente_id);
