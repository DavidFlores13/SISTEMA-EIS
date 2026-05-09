const fs = require("fs");
const path = require("path");

const env = require("../src/config/env");
const { createDb } = require("../src/lib/db");

async function seed() {
  const db = createDb(env.dbPath);

  const seedsDir = path.join(process.cwd(), "db", "seeds");
  const files = fs
    .readdirSync(seedsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), "utf8");
    console.log(`- Ejecutando seed ${file}`);
    await db.exec(sql);
  }

  await db.close();
  console.log("Seeds completados");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
