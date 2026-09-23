const { Router } = require("express");

function createDashboardRouter(dashboardService, authenticate) {
  const router = Router();

  router.get("/", authenticate, async (_req, res, next) => {
    try {
      const stats = await dashboardService.today();
      res.json({ dashboard: stats });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createDashboardRouter };
