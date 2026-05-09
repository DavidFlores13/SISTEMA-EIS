const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppError } = require("../../lib/app-error");

function createAuthService(env) {
  return {
    async login({ username, password }) {
      if (username !== env.adminUser) {
        throw new AppError(401, "Credenciales invalidas");
      }

      let isValid = false;
      if (env.adminPasswordHash) {
        isValid = await bcrypt.compare(password, env.adminPasswordHash);
      } else {
        isValid = password === env.adminPassword;
      }

      if (!isValid) {
        throw new AppError(401, "Credenciales invalidas");
      }

      const token = jwt.sign(
        { sub: env.adminUser, role: "admin" },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
      );

      return { token, token_type: "Bearer", expires_in: env.jwtExpiresIn };
    },
  };
}

module.exports = { createAuthService };
