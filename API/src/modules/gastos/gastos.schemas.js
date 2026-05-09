const { z } = require("zod");

const gastosQuerySchema = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
});

const createGastoSchema = z.object({
  categoria: z.string().min(2),
  monto: z.coerce.number().nonnegative(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  id_sucursal: z.coerce.number().int().positive(),
});

module.exports = { gastosQuerySchema, createGastoSchema };
