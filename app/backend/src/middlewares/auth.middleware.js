import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import process from "node:process";

// ! internal import
import "../configs/env.config.js";
import { database } from "../database/database.js";
import { users } from "../database/models.js";
import log from "../utils/logger.js";

const SECRET =
  process.env.JWT_SECRET || "sidojfijs90fosjdf094jf3094fjisidfjs0fojsvmidj";
const NODE_ENV = process.env.NODE_ENV || "production";

export function setAuthCookie(res, token) {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: NODE_ENV,
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearAuthCookie("accessToken");
}

export function generateToken(user) {
  try {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      SECRET,
      { expiresIn: "2h" },
    );
  } catch (error) {
    log.error("Error while generating token: ", error.message);
  }
}

export function verifyToken(token) {
  try {
    if (!SECRET) {
      throw new Error(
        "JWT secret is missing. set JWT_SECRET in your .env file.",
      );
    }
    return jwt.verify(token, SECRET);
  } catch (error) {
    log.error("Error while verifying token: ", error.message);
  }
}

export async function authenticateToken(token) {
  try {
    const decoded = verifyToken(token);
    const [currentUser] = await database
      .select()
      .from(users)
      .where(eq(users.id, decoded.id));
    if (!currentUser || currentUser.tokenVersion !== decoded.tokenVersion) {
      return null;
    }
    return currentUser;
  } catch (error) {
    log.error("error while authenticating token: ", error.message);
  }
}

export async function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Token Provided",
      });
    }
    try {
      const currentUser = await authenticateToken(token);
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token.",
        });
      }
      req.user = currentUser;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token Expired",
        });
      }
      log.error("Error while cecking auth token: ", error.message);
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
  } catch (error) {
    log.error("Error while checking user is logged in:", error.message);
  }
}

export const isAdmin = function (req, res, next) {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied admins only",
      });
    }
    next();
  } catch (error) {
    log.error("Error while checking is admin: ", error.message);
  }
};

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
}

export default {
  generateToken,
  verifyToken,
  isLoggedIn,
  isAdmin,
  authenticateToken,
  comparePassword,
  requireRole,
};
