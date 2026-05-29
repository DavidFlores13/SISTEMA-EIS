const { z } = require("zod");

const createOportunidadSchema = z.object({
  cliente_id: z.number().int().positive(),
  titulo: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  valor_estimado: z.number().nonnegative().default(0),
  etapa: z.string().optional().default("Contacto Inicial"),
  fecha_cierre_estimada: z.string().optional().nullable(),
});

const oportunidadesQuerySchema = z.object({
  cliente_id: z
    .preprocess((value) => {
      if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
      }
      return value;
    }, z.number().int().positive().optional()),
});

const updateOportunidadSchema = z
  .object({
    cliente_id: z.number().int().positive().optional(),
    titulo: z.string().min(1).optional(),
    descripcion: z.string().optional().nullable(),
    valor_estimado: z.number().nonnegative().optional(),
    etapa: z.string().optional(),
    fecha_cierre_estimada: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

module.exports = {
  createOportunidadSchema,
  oportunidadesQuerySchema,
  updateOportunidadSchema,
};
