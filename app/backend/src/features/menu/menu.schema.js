import { z } from "zod";

export const menuItemResponse = z.object( {
  id: z.number().int(),
  name: z.string().trim().min( 2 ),
  priceCents: z.number().int().nonnegative(),
  active: z.boolean(),
  createdAt: z.date(),
} );

export const menuItemListResponse = z.array( menuItemResponse );

export const createMenuItemInputSchema = z.object( {
  name: z.string().trim().min( 2 ),
  priceCents: z.number().int().nonnegative(),
} );

export const updateMenuItemInputSchema = z.object( {
  name: z.string().trim().min( 2 ).optional(),
  priceCents: z.number().int().nonnegative().optional(),
} );
