const jwt = require("jsonwebtoken");
const { AppError } = require("../lib/app-error");

function createAuthMiddleware(env) {
  return function authenticate(req, _res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        throw new AppError(401, "Token requerido");
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      req.user = decoded;
      return next();
    } catch (error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return next(new AppError(401, "Token invalido o expirado"));
      }
      return next(error);
    }
  };
}

module.exports = { createAuthMiddleware };
