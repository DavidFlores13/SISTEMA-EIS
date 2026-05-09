const express = require("express");
const { validate } = require("../../middlewares/validate");
const { estadoKpiQuerySchema } = require("./kpis.schemas");

function createKpisRoutes(controller) {
  const router = express.Router();

  router.get("/crecimiento-mensual", controller.getMonthlyGrowth);
  router.get("/estado", validate(estadoKpiQuerySchema, "query"), controller.getStatus);

  return router;
}

module.exports = { createKpisRoutes };
