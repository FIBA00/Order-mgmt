import { Router } from "express";
import createMenuItemSchema from "./menu.schema.js";
import MenuService from "./menu.service.js";
import { z } from "zod";

// we need to separate this into small function and import the service into here
const router = Router();
const menuService = MenuService();

export async function getMenus(req, res, next) {
  {
    try {
      const items = await menuService.list();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }
}

export async function createMenu(req, res, next) {
  try {
    const input = createMenuItemSchema.parse(req.body);
    const item = await menuService.create(input.name, input.priceCents);
    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateMenu(req, res, next) {
  try {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const item = await menuService.setActive(Number(req.params.id), active);
    res.json({ item });
  } catch (err) {
    next(err);
  }
}
