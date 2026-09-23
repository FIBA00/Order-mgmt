import { z }  from("zod");

export const createMenuItemInputSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});

export const updateMenuItemInputSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});
