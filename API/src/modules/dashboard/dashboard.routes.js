const express = require("express");

function createDashboardRoutes(controller) {
  const router = express.Router();
  router.get("/resumen", controller.getSummary);
  return router;
}

module.exports = { createDashboardRoutes };
