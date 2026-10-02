import express from "express";

import { database, schema } from "../../database/database.js";
import { createOrdersRepository } from "./orders.repository.js";
import { createOrdersService } from "./orders.service.js";
import { createOrdersController } from "./orders.ctrl.js";
import inputValidationBody from "../../middlewares/validation.middleware.js";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";

import { createOrderSchema, setStatusSchema } from "./orders.schema.js";

const ordersRouter = express.Router();
const repository = createOrdersRepository({ db: database, schema });
const service = createOrdersService(repository);
const controller = createOrdersController(service);

ordersRouter.get("/", isLoggedIn, controller.getOrders);
ordersRouter.get("/:id", isLoggedIn, controller.getOrder);
ordersRouter.post(
  "/",
  isLoggedIn,
  inputValidationBody(createOrderSchema),
  controller.createOrder,
);
ordersRouter.patch(
  "/:id/status",
  isLoggedIn,
  inputValidationBody(setStatusSchema),
  controller.setStatus,
);

export { createOrdersRepository, createOrdersService, createOrdersController };
export default ordersRouter;
