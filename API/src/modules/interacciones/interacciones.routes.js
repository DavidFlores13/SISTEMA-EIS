const express = require("express");
const { validate } = require("../../middlewares/validate");
const {
  createInteraccionSchema,
  interaccionesQuerySchema,
} = require("./interacciones.schemas");

function createInteraccionesRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(interaccionesQuerySchema, "query"), controller.list);
  router.post("/", validate(createInteraccionSchema), controller.create);

  return router;
}

module.exports = { createInteraccionesRoutes };
