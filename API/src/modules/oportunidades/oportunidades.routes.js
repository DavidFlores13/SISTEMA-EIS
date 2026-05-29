const express = require("express");
const { validate } = require("../../middlewares/validate");
const {
  createOportunidadSchema,
  updateOportunidadSchema,
  oportunidadesQuerySchema,
} = require("./oportunidades.schemas");

function createOportunidadesRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(oportunidadesQuerySchema, "query"), controller.list);
  router.post("/", validate(createOportunidadSchema), controller.create);
  router.patch("/:id", validate(updateOportunidadSchema), controller.update);

  return router;
}

module.exports = { createOportunidadesRoutes };
