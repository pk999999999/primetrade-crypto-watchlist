import { validationResult } from 'express-validator';

/**
 * Validation Middleware
 * Checks for express-validator errors and returns formatted response
 * Use after express-validator check chains in routes
 */
export function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the errors below.',
      errors: formattedErrors
    });
  }

  next();
}
