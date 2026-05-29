const express = require("express");
const { validate } = require("../../middlewares/validate");
const {
  clientesQuerySchema,
  createClienteSchema,
  updateClienteSchema,
} = require("./clientes.schemas");

function createClientesRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(clientesQuerySchema, "query"), controller.list);
  router.post("/", validate(createClienteSchema), controller.create);
  router.patch("/:id", validate(updateClienteSchema), controller.update);
  router.delete("/:id", controller.deactivate);

  return router;
}

module.exports = { createClientesRoutes };
