function errorHandler(err, _req, res, _next) {
  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Validation failed", issues: err.issues });
  }

  // Known domain errors thrown by services
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

// Convenience: throw from a service with an attached HTTP status code
function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, createError };
