const jwt = require("jsonwebtoken");

function makeAuthMiddleware(jwtSecret) {
  function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Authentication required" });

    try {
      req.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      res.status(401).json({ error: "Invalid session" });
    }
  }

  function adminOnly(req, res, next) {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  return { authenticate, adminOnly };
}

module.exports = { makeAuthMiddleware };
