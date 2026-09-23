
import { AuthService } from "./auth.service.js";

const authService = AuthService()

export async function loginUser ( req, res, next ) 
{
	try
	{
		const input = loginSchema.parse( req.body );
		const user = await authService.login( input.username, input.password );
		const token = jwt.sign( user, jwtSecret, { expiresIn: "8h" } );
		res.json( { token, user } );
	} catch ( err )
	{
		next( err );
	}
}

export async function profileUser ( req, res ) 
{
	res.json( { user: req.user } );
} 
