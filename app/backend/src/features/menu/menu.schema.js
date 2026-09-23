const { z } = require("zod");

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});

export default createMenuItemSchema;
