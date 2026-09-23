const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { loginSchema } = require("./auth.schema");

function createAuthRouter(authService, jwtSecret, authenticate) {
  const router = Router();

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = await authService.login(input.username, input.password);
      const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  });

  router.get("/me", authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}

module.exports = { createAuthRouter };
