import { database, schema } from "../database/database.js";

import { createMenuRepository } from "./menu/menu.repository.js";
import { createMenuService } from "./menu/menu.service.js";

const menuRepository = createMenuRepository( { db: database, schema, } );
const menuService = createMenuService( menuRepository );

export { menuService, };