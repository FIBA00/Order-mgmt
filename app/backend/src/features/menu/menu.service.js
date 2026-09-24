export function createMenuService ( menuRepository )
{
  async function list ()
  {
    return menuRepository.findAll();
  }

  async function create ( { name, priceCents } )
  {
    return menuRepository.create( {
      name,
      priceCents,
    } );
  }

  async function update ( id, data )
  {
    const item = await menuRepository.findById( id );

    if ( !item )
    {
      const error = new Error( "Menu item not found" );
      error.statusCode = 404;
      throw error;
    }

    return menuRepository.update( id, {
      name: data.name,
      priceCents: data.priceCents,
    } );
  }

  async function setActive ( id, active )
  {
    const item = await menuRepository.findById( id );

    if ( !item )
    {
      const error = new Error( "Menu item not found" );
      error.statusCode = 404;
      throw error;
    }

    return menuRepository.setActive( id, active );
  }

  return {
    list,
    create,
    update,
    setActive,
  };
}