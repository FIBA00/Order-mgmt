import { Router } from "express";
import { z } from "zod";

import {
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
} from "./menu.schema.js";
import MenuService from "./menu.service.js";

// we need to separate this into small function and import the service into here
const router = Router();
const menuService = MenuService();

export async function getMenus(req, res, next) {
  {
    try {
      const items = await menuService.list();
      return res.status(200).json({
        success: true,
        message: "Successfully retrieved menu items.",
        data: items,
      });
    } catch (err) {
      console.error("Error while getting menu items:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while getting menu items.",
      });
    }
  }
}

export async function createMenu(req, res, next) {
  try {
    const input = createMenuItemInputSchema.parse(req.body);
    const item = await menuService.create(input.name, input.priceCents);
    return res.status(200).json({
      success: true,
      message: "Successfully created menu.",
      data: item,
    });
  } catch (err) {
    console.error("Error while creating  menu items:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating menu items.",
    });
  }
}

export async function updateMenu(req, res, next) {
  try {
    const data = {
      name: req.body.name,
    };
    const menuid = req.params.id;
    const item = await menuService.update(menuid, data);

    return res.status(200).json({
      success: true,
      message: "Successfully activate menu item.",
      data: item,
    });
  } catch (error) {
    console.error("error while activate menu item: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while activate menu item !.",
    });
  }
}

export async function activateMenu(req, res, next) {
  try {
    const id = req.params.id;
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const item = await menuService.setActive(Number(id), active);
    return res.status(200).json({
      success: true,
      message: "Successfully activate menu item.",
      data: item,
    });
  } catch (error) {
    console.error("error while updating menu item: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating menu item !.",
    });
  }
}
