const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { createV1Router } = require("./routes/v1");
const { errorHandler } = require("./middlewares/error-handler");
const { notFound } = require("./middlewares/not-found");

function createApp({ db, env }) {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      message: "API Sistema EIS activa",
      version: "v1",
      auth: "POST /api/v1/auth/login",
      docs_hint: "Usa Authorization: Bearer <token> para rutas protegidas",
    });
  });

  app.use("/api/v1", createV1Router({ db, env }));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
