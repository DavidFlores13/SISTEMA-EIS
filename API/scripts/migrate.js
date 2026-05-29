const fs = require("fs");
const path = require("path");

const env = require("../src/config/env");
const { createDb } = require("../src/lib/db");

async function tableExists(db, name) {
  const row = await db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [name]
  );
  return Boolean(row);
}

async function hasColumn(db, table, column) {
  const rows = await db.all(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === column);
}

async function normalizeOldCrmSchema(db) {
  const hasOldClientes =
    (await tableExists(db, "clientes")) &&
    (await hasColumn(db, "clientes", "id_cliente"));

  const hasOldOportunidades =
    (await tableExists(db, "oportunidades_venta")) &&
    (await hasColumn(db, "oportunidades_venta", "id_oportunidad"));

  const hasOldInteracciones =
    (await tableExists(db, "interacciones_crm")) &&
    (await hasColumn(db, "interacciones_crm", "id_interaccion"));

  if (!hasOldClientes && !hasOldOportunidades && !hasOldInteracciones) {
    return false;
  }

  await db.exec("DROP TABLE IF EXISTS clientes_old;");
  await db.exec("DROP TABLE IF EXISTS oportunidades_venta_old;");
  await db.exec("DROP TABLE IF EXISTS interacciones_crm_old;");

  if (hasOldClientes) {
    await db.run("ALTER TABLE clientes RENAME TO clientes_old");
  }
  if (hasOldOportunidades) {
    await db.run("ALTER TABLE oportunidades_venta RENAME TO oportunidades_venta_old");
  }
  if (hasOldInteracciones) {
    await db.run("ALTER TABLE interacciones_crm RENAME TO interacciones_crm_old");
  }

  return true;
}

async function migrateOldCrmData(db) {
  if (await tableExists(db, "clientes_old")) {
    await db.exec(`
      INSERT INTO clientes (id, nombre_empresa, rtn, nombre_contacto, correo, telefono, direccion, fecha_registro, estado)
      SELECT id_cliente, nombre_empresa, rtn, nombre_contacto, correo, telefono, direccion, fecha_registro, estado
      FROM clientes_old;
    `);
    await db.exec("DROP TABLE clientes_old;");
  }

  if (await tableExists(db, "oportunidades_venta_old")) {
    await db.exec(`
      INSERT INTO oportunidades_venta (id, cliente_id, titulo, descripcion, valor_estimado, etapa, fecha_cierre_estimada, fecha_creacion, fecha_actualizacion)
      SELECT id_oportunidad, id_cliente, titulo_oportunidad, descripcion, valor_estimado, etapa, fecha_cierre_estimada, fecha_creacion, fecha_actualizacion
      FROM oportunidades_venta_old;
    `);
    await db.exec("DROP TABLE oportunidades_venta_old;");
  }

  if (await tableExists(db, "interacciones_crm_old")) {
    await db.exec(`
      INSERT INTO interacciones_crm (id, cliente_id, tipo_interaccion, comentarios, fecha_interaccion)
      SELECT id_interaccion, id_cliente, tipo_interaccion, comentarios, fecha_interaccion
      FROM interacciones_crm_old;
    `);
    await db.exec("DROP TABLE interacciones_crm_old;");
  }
}

async function migrate() {
  const db = createDb(env.dbPath);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = await db.get(
      "SELECT 1 FROM schema_migrations WHERE filename = ?",
      [file]
    );

    if (already) {
      console.log(`- Saltando ${file} (ya aplicada)`);
      continue;
    }

    const shouldConvertOldSchema = file === "002_crm_tables.sql";
    if (shouldConvertOldSchema) {
      await normalizeOldCrmSchema(db);
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`- Aplicando ${file}`);
    await db.exec("BEGIN TRANSACTION;");
    try {
      await db.exec(sql);
      if (shouldConvertOldSchema) {
        await migrateOldCrmData(db);
      }
      await db.run("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
      await db.exec("COMMIT;");
    } catch (error) {
      await db.exec("ROLLBACK;");
      throw error;
    }
  }

  await db.close();
  console.log("Migraciones completadas");
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
