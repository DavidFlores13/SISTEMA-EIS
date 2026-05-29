const { z } = require("zod");

const createClienteSchema = z.object({
  nombre_empresa: z.string().min(1),
  rtn: z.string().optional().nullable(),
  nombre_contacto: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  estado: z.string().optional().default("Prospecto"),
});

const clientesQuerySchema = z.object({
  estado: z.string().optional(),
  cliente_id: z
    .preprocess((value) => {
      if (typeof value === "string" && value.trim() !== "") {
        return Number(value);
      }
      return value;
    }, z.number().int().positive().optional()),
});

const updateClienteSchema = z
  .object({
    nombre_empresa: z.string().min(1).optional(),
    rtn: z.string().optional().nullable(),
    nombre_contacto: z.string().min(1).optional(),
    correo: z.string().email().optional(),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    estado: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

module.exports = { createClienteSchema, updateClienteSchema, clientesQuerySchema };
