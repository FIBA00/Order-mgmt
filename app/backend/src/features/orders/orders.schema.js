const { z } = require("zod");

const createOrderSchema = z.object({
  items: z.array(z.object({
    menuItemId: z.number().int(),
    quantity:   z.number().int().positive()
  })).min(1)
});

const setStatusSchema = z.object({
  status: z.enum(["open", "paid", "cancelled"])
});

module.exports = { createOrderSchema, setStatusSchema };
