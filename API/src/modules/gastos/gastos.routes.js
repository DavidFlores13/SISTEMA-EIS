const express = require("express");
const { validate } = require("../../middlewares/validate");
const { gastosQuerySchema, createGastoSchema } = require("./gastos.schemas");

function createGastosRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(gastosQuerySchema, "query"), controller.list);
  router.post("/", validate(createGastoSchema), controller.create);

  return router;
}

module.exports = { createGastosRoutes };
