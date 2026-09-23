import express from "express";

// ! internal imports
import inputValidationBody from "../../middlewares/validation.middleware.js";
import respondWith from "../../middlewares/response.middleware.js";
import { isLoggedIn, requireRole } from "../../middlewares/auth.middleware.js";
import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
} from "./menu.schema.js";
import { getMenus, createMenu, updateMenu } from "./menu.ctrl.js";

const menuRoute = express.Router();

menuRoute.get("/", requireRole("owner"), getMenus);
menuRoute.post(
  "/",
  requireRole("owner"),
  inputValidationBody(createMenuItemInputSchema),
  createMenu,
);

menuRoute.put(
  "/apply/:id",
  requireRole("owner"),
  inputValidationBody(updateMenuItemInputSchema),
  updateMenu,
);

export default menuRoute;
