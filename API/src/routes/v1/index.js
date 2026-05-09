const express = require("express");

const { createAuthMiddleware } = require("../../middlewares/auth");

const { createAuthService } = require("../../modules/auth/auth.service");
const { createAuthController } = require("../../modules/auth/auth.controller");
const { createAuthRoutes } = require("../../modules/auth/auth.routes");

const { createSucursalesService } = require("../../modules/sucursales/sucursales.service");
const { createSucursalesController } = require("../../modules/sucursales/sucursales.controller");
const { createSucursalesRoutes } = require("../../modules/sucursales/sucursales.routes");

const { createVentasService } = require("../../modules/ventas/ventas.service");
const { createVentasController } = require("../../modules/ventas/ventas.controller");
const { createVentasRoutes } = require("../../modules/ventas/ventas.routes");

const { createGastosService } = require("../../modules/gastos/gastos.service");
const { createGastosController } = require("../../modules/gastos/gastos.controller");
const { createGastosRoutes } = require("../../modules/gastos/gastos.routes");

const { createMetasService } = require("../../modules/metas/metas.service");
const { createMetasController } = require("../../modules/metas/metas.controller");
const { createMetasRoutes } = require("../../modules/metas/metas.routes");

const { createKpisService } = require("../../modules/kpis/kpis.service");
const { createKpisController } = require("../../modules/kpis/kpis.controller");
const { createKpisRoutes } = require("../../modules/kpis/kpis.routes");

const { createDashboardService } = require("../../modules/dashboard/dashboard.service");
const { createDashboardController } = require("../../modules/dashboard/dashboard.controller");
const { createDashboardRoutes } = require("../../modules/dashboard/dashboard.routes");

function createV1Router({ db, env }) {
  const router = express.Router();

  const authController = createAuthController(createAuthService(env));
  router.use("/auth", createAuthRoutes(authController));

  const authenticate = createAuthMiddleware(env);
  router.use(authenticate);

  router.use(
    "/sucursales",
    createSucursalesRoutes(
      createSucursalesController(createSucursalesService(db))
    )
  );

  router.use("/ventas", createVentasRoutes(createVentasController(createVentasService(db))));
  router.use("/gastos", createGastosRoutes(createGastosController(createGastosService(db))));
  router.use("/metas", createMetasRoutes(createMetasController(createMetasService(db))));
  router.use("/kpis", createKpisRoutes(createKpisController(createKpisService(db))));
  router.use(
    "/dashboard",
    createDashboardRoutes(createDashboardController(createDashboardService(db)))
  );

  return router;
}

module.exports = { createV1Router };
