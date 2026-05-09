const express = require("express");
const { validate } = require("../../middlewares/validate");
const { ventasQuerySchema, createVentaSchema } = require("./ventas.schemas");

function createVentasRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(ventasQuerySchema, "query"), controller.list);
  router.post("/", validate(createVentaSchema), controller.create);

  return router;
}

module.exports = { createVentasRoutes };
