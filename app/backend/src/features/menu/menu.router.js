import express from "express";

import { database, schema } from "../../database/database.js";
import { createMenuRepository } from "./menu.repository.js";
import { createMenuService } from "./menu.service.js";
import { createMenuController } from "./menu.ctrl.js";
import inputValidationBody from "../../middlewares/validation.middleware.js";
import respondWith from "../../middlewares/response.middleware.js";

import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
  menuItemListResponse,
  menuItemResponse,
} from "./menu.schema.js";

const menuRouter = express.Router();
const repository = createMenuRepository({ db: database, schema });
const service = createMenuService(repository);
const controller = createMenuController(service);

menuRouter.get("/", respondWith(menuItemListResponse), controller.getMenus);
menuRouter.get("/:id", respondWith(menuItemResponse), controller.getMenu);
menuRouter.post(
  "/",
  inputValidationBody(createMenuItemInputSchema),
  respondWith(menuItemResponse),
  controller.createMenu,
);
menuRouter.patch(
  "/:id",
  inputValidationBody(updateMenuItemInputSchema),
  respondWith(menuItemResponse),
  controller.updateMenu,
);
menuRouter.delete("/:id", respondWith(menuItemResponse), controller.deleteMenu);

export default menuRouter;
