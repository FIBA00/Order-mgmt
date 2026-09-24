import express from "express";

import { database, schema } from "../../database/database.js";
import { createMenuRepository } from "./menu.repository.js";
import { createMenuService } from "./menu.service.js";
import { createMenuController } from "./menu.ctrl.js";
import inputValidationBody from "../../middlewares/validation.middleware.js";

import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
} from "./menu.schema.js";

const menuRouter = express.Router();
const repository = createMenuRepository({ db: database, schema, });
const service = createMenuService(repository);
const controller = createMenuController(service);

menuRouter.get("/", controller.getMenus);
menuRouter.get("/:id", controller.getMenu);
menuRouter.post(
  "/",
  inputValidationBody(createMenuItemInputSchema),
  controller.createMenu,
);
menuRouter.patch(
  "/:id",
  inputValidationBody(updateMenuItemInputSchema),
  controller.updateMenu,
);

export default menuRouter;
