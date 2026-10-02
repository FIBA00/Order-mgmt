import express from "express";

import { database, schema } from "../../database/database.js";
import { createAuthRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import { createAuthController } from "./auth.ctrl.js";
import inputValidationBody from "../../middlewares/validation.middleware.js";
import { isLoggedIn } from "../../middlewares/auth.middleware.js";

import { loginSchema, signupSchema } from "./auth.schema.js";

const authRouter = express.Router();
const repository = createAuthRepository({ db: database, schema });
const service = createAuthService(repository);
const controller = createAuthController(service);

authRouter.post("/login", inputValidationBody(loginSchema), controller.login);
authRouter.post(
  "/signup",
  inputValidationBody(signupSchema),
  controller.signup,
);
authRouter.get("/me", isLoggedIn, controller.profile);

export { createAuthRepository, createAuthService, createAuthController };
export default authRouter;
