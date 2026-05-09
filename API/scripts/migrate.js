const fs = require("fs");
const path = require("path");

const env = require("../src/config/env");
const { createDb } = require("../src/lib/db");

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

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`- Aplicando ${file}`);
    await db.exec("BEGIN TRANSACTION;");
    try {
      await db.exec(sql);
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
