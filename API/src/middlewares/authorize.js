const { AppError } = require("../lib/app-error");

function createRoleMiddleware(allowedRoles = []) {
  return function authorize(req, _res, next) {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return next(new AppError(403, "Acceso denegado"));
    }
    return next();
  };
}

module.exports = { createRoleMiddleware };
