const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppError } = require("../../lib/app-error");

function createAuthService(env, db) {
  return {
    async login({ username, password }) {
      const dbUser = await db.get(
        "SELECT username, password_hash, role FROM users WHERE username = ?",
        [username]
      );

      let isValid = false;
      let role = "eis";

      if (dbUser) {
        role = dbUser.role || role;
        const hash = dbUser.password_hash || "";
        if (hash.startsWith("$2")) {
          isValid = await bcrypt.compare(password, hash);
        } else {
          isValid = password === hash;
        }
      } else if (username === env.adminUser) {
        role = "admin";
        if (env.adminPasswordHash) {
          isValid = await bcrypt.compare(password, env.adminPasswordHash);
        } else {
          isValid = password === env.adminPassword;
        }
      }

      if (!isValid) {
        throw new AppError(401, "Credenciales invalidas");
      }

      const token = jwt.sign(
        { sub: username, role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
      );

      return {
        token,
        token_type: "Bearer",
        expires_in: env.jwtExpiresIn,
        user: { username, role },
      };
    },
  };
}

module.exports = { createAuthService };
