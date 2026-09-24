import { AuthService } from "./auth.service.js";
import { loginSchema, signupSchema } from "./auth.schema.js";

const authService = AuthService();

export async function loginUser ( req, res, next )
{
	try
	{
		const input = loginSchema.parse( req.body );
		const user = await authService.login( input.username, input.password );
		const token = jwt.sign( user, jwtSecret, { expiresIn: "8h" } );

		if ( !user )
		{
			return res
				.status( 404 )
				.json( { success: false, message: "User not found." } );
		}
		return res.status( 200 ).json( {
			success: true,
			message: "Hello there user",
			data: { userId: user.id, userEmail: user.email, token: token },
		} );
	} catch ( error )
	{
		console.log( "Error while checking user profile: ", error.message );
		return res.status( 500 ).json( {
			success: false,
			message: "Error while handling user",
		} );
	}
}

export async function signupUser ( req, res, next )
{
	try
	{
		const input = signupSchema.parse( req.body );
		const user = await authService.signup( input.username, input.password );
		const token = jwt.sign( user, jwtSecret, { expiresIn: "8h" } );
		res.json( { token, user } );
		
	} catch ( error )
	{
		console.log( "Error while signing up user:", error.message );
		return res
			.status( 500 )
			.json( { success: false, message: "Error signing up user." } );
	}
}

export async function profileUser ( req, res )
{
	res.json( { user: req.user } );
}
