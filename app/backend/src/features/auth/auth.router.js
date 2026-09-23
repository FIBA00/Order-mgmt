import { Router } from "express";
import { loginSchema } from "./auth.schema.js";
import jwt from "jsonwebtoken";
import { loginUser, profileUser } from "./auth.ctrl.js";


const authRouter = Router();

authRouter.post( "/login", loginUser)
authRouter.get( "/me",  profileUser )


export default authRouter;