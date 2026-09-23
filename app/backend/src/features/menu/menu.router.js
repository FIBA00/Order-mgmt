import express from "express";

// ! internal imports
import inputValidationBody from "../../middlewares/validation.middleware.js";
import respondWith from "../../middlewares/response.middleware.js";
import { isLoggedIn, requireRole } from "../../middlewares/auth.middleware.js";
import createMenuItemSchema from "./menu.schema.js";
import { getMenus, createMenu } from "./menu.ctrl.js";

const menuRoute = express.Router();

menuRoute.get(
  "/",
  isLoggedIn,
  requireRole("owner"),
  respondWith(OwnerShopListResponse),
  getMenus,
);
menuRoute.post(
  "/",
  isLoggedIn,
  requireRole("owner"),
  inputValidationBody(createMenuItemSchema),
  createMenu,
);

export default menuRoute;
