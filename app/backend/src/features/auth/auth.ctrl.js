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

  async function listStaff(req, res, next) {
    try {
      const staff = await service.listStaff();
      return res.status(200).json({
        success: true,
        data: staff,
        staff,
      });
    } catch (error) {
      next(error);
    }
  }

  async function createStaff(req, res, next) {
    try {
      const { username, password, role } = req.body;
      const { user } = await service.signup(username, password, role || "cashier");
      return res.status(201).json({
        success: true,
        message: "Staff account created successfully",
        user,
        data: user,
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

  async function deleteStaff(req, res, next) {
    try {
      const id = Number(req.params.id);
      if (!id || Number.isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Valid user ID is required",
        });
      }
      if (req.user && req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own admin account",
        });
      }
      await service.deleteStaff(id);
      return res.status(200).json({
        success: true,
        message: "Staff account removed",
      });
    } catch (error) {
      if (
        error.statusCode === 400 ||
        error.statusCode === 404 ||
        error.statusCode === 409
      ) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  return {
    login,
    signup,
    profile,
    listStaff,
    createStaff,
    deleteStaff,
  };
}
