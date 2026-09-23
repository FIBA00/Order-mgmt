const { Router } = require("express");
const { createMenuItemSchema } = require("./menu.schema");

function createMenuRouter(menuService, authenticate, adminOnly) {
  const router = Router();

  router.get("/", authenticate, async (_req, res, next) => {
    try {
      const items = await menuService.list();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", authenticate, adminOnly, async (req, res, next) => {
    try {
      const input = createMenuItemSchema.parse(req.body);
      const item = await menuService.create(input.name, input.priceCents);
      res.status(201).json({ item });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:id/active", authenticate, adminOnly, async (req, res, next) => {
    try {
      const { z } = require("zod");
      const { active } = z.object({ active: z.boolean() }).parse(req.body);
      const item = await menuService.setActive(Number(req.params.id), active);
      res.json({ item });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMenuRouter };
