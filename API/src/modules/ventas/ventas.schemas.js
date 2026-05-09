const { z } = require("zod");

const ventasQuerySchema = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
});

const createVentaSchema = z.object({
  monto_total: z.coerce.number().nonnegative(),
  cantidad_transacciones: z.coerce.number().int().nonnegative(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  id_sucursal: z.coerce.number().int().positive(),
});

module.exports = { ventasQuerySchema, createVentaSchema };
