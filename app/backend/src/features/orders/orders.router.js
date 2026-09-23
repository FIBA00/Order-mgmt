const { Router } = require("express");
const { createOrderSchema, setStatusSchema } = require("./orders.schema");

function createOrdersRouter(ordersService, authenticate) {
  const router = Router();

  router.get("/", authenticate, async (_req, res, next) => {
    try {
      const ordersList = await ordersService.list();
      res.json({ orders: ordersList });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", authenticate, async (req, res, next) => {
    try {
      const input = createOrderSchema.parse(req.body);
      const order = await ordersService.create(req.user.id, input.items);
      res.status(201).json({ order });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id/status", authenticate, async (req, res, next) => {
    try {
      const { status } = setStatusSchema.parse(req.body);
      const order = await ordersService.setStatus(
        Number(req.params.id),
        status,
      );
      res.json({ order });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createOrdersRouter };
