const express = require("express");

const { createAuthMiddleware } = require("../../middlewares/auth");

const { createAuthService } = require("../../modules/auth/auth.service");
const { createAuthController } = require("../../modules/auth/auth.controller");
const { createAuthRoutes } = require("../../modules/auth/auth.routes");
const { createRoleMiddleware } = require("../../middlewares/authorize");

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

const { createClientesService } = require("../../modules/clientes/clientes.service");
const { createClientesController } = require("../../modules/clientes/clientes.controller");
const { createClientesRoutes } = require("../../modules/clientes/clientes.routes");

const { createOportunidadesService } = require("../../modules/oportunidades/oportunidades.service");
const { createOportunidadesController } = require("../../modules/oportunidades/oportunidades.controller");
const { createOportunidadesRoutes } = require("../../modules/oportunidades/oportunidades.routes");

const { createInteraccionesService } = require("../../modules/interacciones/interacciones.service");
const { createInteraccionesController } = require("../../modules/interacciones/interacciones.controller");
const { createInteraccionesRoutes } = require("../../modules/interacciones/interacciones.routes");

function createV1Router({ db, env }) {
  const router = express.Router();

  const authController = createAuthController(createAuthService(env, db));
  router.use("/auth", createAuthRoutes(authController));

  const authenticate = createAuthMiddleware(env);
  router.use(authenticate);

  const authorizeEis = createRoleMiddleware(["admin", "eis"]);
  const authorizeCrm = createRoleMiddleware(["admin", "crm"]);

  router.use(
    "/sucursales",
    authorizeEis,
    createSucursalesRoutes(
      createSucursalesController(createSucursalesService(db))
    )
  );

  router.use(
    "/ventas",
    authorizeEis,
    createVentasRoutes(createVentasController(createVentasService(db)))
  );
  router.use(
    "/gastos",
    authorizeEis,
    createGastosRoutes(createGastosController(createGastosService(db)))
  );
  router.use(
    "/metas",
    authorizeEis,
    createMetasRoutes(createMetasController(createMetasService(db)))
  );
  router.use(
    "/kpis",
    authorizeEis,
    createKpisRoutes(createKpisController(createKpisService(db)))
  );
  router.use(
    "/dashboard",
    authorizeEis,
    createDashboardRoutes(createDashboardController(createDashboardService(db)))
  );

  router.use(
    "/clientes",
    authorizeCrm,
    createClientesRoutes(createClientesController(createClientesService(db)))
  );

  router.use(
    "/oportunidades",
    authorizeCrm,
    createOportunidadesRoutes(
      createOportunidadesController(createOportunidadesService(db))
    )
  );

  router.use(
    "/interacciones",
    authorizeCrm,
    createInteraccionesRoutes(
      createInteraccionesController(createInteraccionesService(db)))
  );

  return router;
}

module.exports = { createV1Router };
