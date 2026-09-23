const { z } = require("zod");

export const createMenuItemSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegativ(),
});
