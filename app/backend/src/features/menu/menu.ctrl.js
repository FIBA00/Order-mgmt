import { createMenuItemInputSchema, updateMenuItemInputSchema, } from "./menu.schema.js";

export function createMenuController ( menuService )
{
  async function getMenus ( req, res, next )
  {
    try
    {
      const items = await menuService.list();
      return res.status( 200 ).json( {
        success: true,
        message: "Successfully retrieved menu items.",
        data: items,
      } );
    } catch ( error )
    {
      next( error );
    }
  }

  async function createMenu ( req, res, next )
  {
    try
    {
      const input = createMenuItemInputSchema.parse( req.body );
      const item = await menuService.create( input );
      return res.status( 201 ).json( {
        success: true,
        message: "Successfully created menu item.",
        data: item,
      } );
    } catch ( error )
    {
      next( error );
    }
  }

  async function updateMenu ( req, res, next )
  {
    try
    {
      const id = Number( req.params.id );
      const input = updateMenuItemInputSchema.parse( req.body );
      const item = await menuService.update( id, input );
      return res.status( 200 ).json( {
        success: true,
        message: "Successfully updated menu item.",
        data: item,
      } );
    } catch ( error )
    {
      next( error );
    }
  }

  return {
    getMenus,
    createMenu,
    updateMenu,
  };
}