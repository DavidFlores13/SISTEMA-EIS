const express = require("express");
const { validate } = require("../../middlewares/validate");
const { metasQuerySchema, createMetaSchema } = require("./metas.schemas");

function createMetasRoutes(controller) {
  const router = express.Router();

  router.get("/", validate(metasQuerySchema, "query"), controller.list);
  router.post("/", validate(createMetaSchema), controller.create);

  return router;
}

module.exports = { createMetasRoutes };
