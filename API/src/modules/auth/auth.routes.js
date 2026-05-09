const express = require("express");
const { validate } = require("../../middlewares/validate");
const { loginSchema } = require("./auth.schemas");

function createAuthRoutes(authController) {
  const router = express.Router();

  router.post("/login", validate(loginSchema), authController.login);

  return router;
}

module.exports = { createAuthRoutes };
