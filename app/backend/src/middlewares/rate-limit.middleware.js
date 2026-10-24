// in-memory sliding window rate limiter to protect auth routes from brute-force attacks
export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 30;
  const hits = new Map();

  // clean up expired rate limit buckets periodically
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, windowMs);
  timer.unref?.();

  return function rateLimiter(req, res, next) {
    // bypass during standard tests unless explicitly enabled
    if (process.env.NODE_ENV === "test" && !options.enableInTest) {
      return next();
    }

    // extract client IP identifier
    const key = req.ip || req.socket?.remoteAddress || "global";
    const now = Date.now();
    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please try again later.",
      });
    }

    next();
  };
}

export default createRateLimiter;
