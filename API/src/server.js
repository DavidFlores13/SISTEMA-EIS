const env = require("./config/env");
const { createDb } = require("./lib/db");
const { createApp } = require("./app");

const db = createDb(env.dbPath);
const app = createApp({ db, env });

app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}`);
});
