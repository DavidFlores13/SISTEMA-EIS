const { z } = require("zod");

const metasQuerySchema = z.object({
  id_sucursal: z.coerce.number().int().positive().optional(),
  anio: z.coerce.number().int().min(2000).max(2200).optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
});

const createMetaSchema = z.object({
  nombre_kpi: z.string().min(2),
  valor_objetivo: z.coerce.number().nonnegative(),
  mes: z.coerce.number().int().min(1).max(12),
  anio: z.coerce.number().int().min(2000).max(2200),
  id_sucursal: z.coerce.number().int().positive(),
});

module.exports = { metasQuerySchema, createMetaSchema };
