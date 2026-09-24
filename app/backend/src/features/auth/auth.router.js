import express from "express";
import jwt from "jsonwebtoken";

// ! internal imports
import { loginSchema } from "./auth.schema.js";
import { loginUser, profileUser, signupUser } from "./auth.ctrl.js";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";

const authRouter = express.Router();
authRouter.get("/me", isLoggedIn, profileUser);
authRouter.post("/login", loginUser);
authRouter.post("/signup", signupUser);

export default authRouter;
