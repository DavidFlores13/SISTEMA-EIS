const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3),
});

module.exports = { loginSchema };
