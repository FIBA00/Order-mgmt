import express from "express";

import { database, schema } from "../../database/database.js";
import { createDashboardRepository } from "./dashboard.repository.js";
import { createDashboardService } from "./dashboard.service.js";
import { createDashboardController } from "./dashboard.ctrl.js";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";

const dashboardRouter = express.Router();
const repository = createDashboardRepository({ db: database, schema });
const service = createDashboardService(repository);
const controller = createDashboardController(service);

dashboardRouter.get("/", isLoggedIn, controller.getToday);
dashboardRouter.get("/today", isLoggedIn, controller.getToday);

export {
  createDashboardRepository,
  createDashboardService,
  createDashboardController,
};
export default dashboardRouter;
