import { z } from "zod";

export const orderItemInputSchema = z.object({
  menuItemId: z.number().int(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1),
});

export const setStatusSchema = z.object({
  status: z.enum(["open", "paid", "cancelled"]),
});

export const orderResponse = z.object({
  id: z.number().int(),
  userId: z.number().int().optional(),
  status: z.string(),
  totalCents: z.number().int(),
  createdAt: z.any().optional(),
  username: z.string().optional(),
});
