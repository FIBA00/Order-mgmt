import { z } from "zod";

export const menuItemResponse = z.object({
  id: z.string(),
  name: z.string().trim().min(2),
  priceCents: z.number(),
  active: z.boolean(),
});

export const menuItemListResponse = z.array(menuItemResponse);

export const createMenuItemInputSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});

export const updateMenuItemInputSchema = z.object({
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
});
