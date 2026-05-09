const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  dbPath: process.env.DB_PATH || path.join(process.cwd(), "DB EIS.db"),
  jwtSecret: process.env.JWT_SECRET || "cambia-este-secreto",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  adminUser: process.env.ADMIN_USER || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
