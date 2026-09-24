import log from "../utils/logger.js";

export default function respondWith(schema) {
  return function handleSchema(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function handleBody(body) {
      try {
        if (body?.data) {
          body.data = schema.parse(body.data);
        }
      } catch (error) {
        log.error("Response validation failed", error.message);
        return originalJson({
          success: false,
          message: "Server response validation failed.",
        });
      }
      return originalJson(body);
    };
    next();
  };
}
