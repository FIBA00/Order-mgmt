import { setAuthCookie } from "../../middlewares/auth.middleware.js";

export function createAuthController(service) {
  async function login(req, res, next) {
    try {
      const { username, password } = req.body;
      const { user, token } = await service.login(username, password);

      setAuthCookie(res, token);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user,
        data: { user, token },
      });
    } catch (error) {
      if (error.statusCode === 401) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async function signup(req, res, next) {
    try {
      const { username, password, role } = req.body;
      const { user, token } = await service.signup(username, password, role);

      setAuthCookie(res, token);
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user,
        data: { user, token },
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async function profile(req, res, next) {
    try {
      const user = await service.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        user,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    login,
    signup,
    profile,
  };
}
