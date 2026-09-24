export default function inputValidationBody(schema) {
  return function handleSchema(req, res, next) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(402).json({
        success: false,
        message: "VALIDATION FAILED !! ",
        errors: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
