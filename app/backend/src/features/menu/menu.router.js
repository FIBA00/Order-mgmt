import express from "express";

import inputValidationBody from "../../middlewares/validation.middleware.js";
import { requireRole } from "../../middlewares/auth.middleware.js";

import { createMenuItemInputSchema, updateMenuItemInputSchema, } from "./menu.schema.js";

import { menuService } from "../index.js";
import { createMenuController } from "./menu.ctrl.js";

const router = express.Router();
const controller = createMenuController(menuService);

router.get("/", controller.getMenus);
router.get("/pub", controller.getMenus);
router.post(
  "/",
  requireRole("admin", "owner"),
  inputValidationBody(createMenuItemInputSchema),
  controller.createMenu,
);
router.patch(
  "/:id",
  requireRole("admin", "owner"),
  inputValidationBody(updateMenuItemInputSchema),
  controller.updateMenu,
);

export default router;