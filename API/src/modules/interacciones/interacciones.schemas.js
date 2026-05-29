const { z } = require("zod");

const createInteraccionSchema = z.object({
  cliente_id: z.number().int().positive(),
  tipo_interaccion: z.string().min(1),
  comentarios: z.string().min(1),
  fecha_interaccion: z.string().optional().nullable(),
});

const interaccionesQuerySchema = z.object({
  cliente_id: z
    .preprocess((value) => {
      if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
      }
      return value;
    }, z.number().int().positive().optional()),
});

module.exports = { createInteraccionSchema, interaccionesQuerySchema };
