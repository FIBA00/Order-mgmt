import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import process from "node:process";

// ! internal import
import "../configs/env.config.js";
import { database, schema } from "../database/database.js";
import log from "../utils/logger.js";

const SECRET =
  process.env.JWT_SECRET || "sidojfijs90fosjdf094jf3094fjisidfjs0fojsvmidj";
const NODE_ENV = process.env.NODE_ENV || "development";
const { users } = schema;

export function setAuthCookie(res, token) {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie("accessToken");
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role || "cashier",
    },
    SECRET,
    { expiresIn: "8h" },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    log.error("Error while verifying token: " + error.message);
    return null;
  }
}

export async function authenticateToken(token) {
  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return null;
    }
    const [currentUser] = await database
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    return currentUser ?? null;
  } catch (error) {
    log.error("Error while authenticating token: " + error.message);
    return null;
  }
}

export async function isLoggedIn(req, res, next) {
  try {
    let token = null;

    // Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const currentUser = await authenticateToken(token);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    log.error("Error in isLoggedIn middleware: " + error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

export function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
  next();
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, stored) {
  if (!password || !stored) return false;

  // bcrypt check
  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  ) {
    return await bcrypt.compare(password, stored);
  }

  // scrypt legacy check (salt:hash)
  if (stored.includes(":")) {
    const [salt, expected] = stored.split(":");
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(actual, "hex"),
      Buffer.from(expected, "hex"),
    );
  }

  return false;
}

export function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
}

export default {
  setAuthCookie,
  clearAuthCookie,
  generateToken,
  verifyToken,
  authenticateToken,
  isLoggedIn,
  isAdmin,
  hashPassword,
  comparePassword,
  requireRole,
};
