const express = require("express");

function createSucursalesRoutes(controller) {
  const router = express.Router();
  router.get("/", controller.list);
  return router;
}

module.exports = { createSucursalesRoutes };
