const { ZodError } = require("zod");

function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validacion fallida",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      details: err.details || null,
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Error interno del servidor" });
}

module.exports = { errorHandler };
