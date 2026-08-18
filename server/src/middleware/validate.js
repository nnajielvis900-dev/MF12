import { ZodError } from 'zod';

/** Wraps async route handlers so thrown errors hit the central error handler. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Converts Zod validation failures into a 400 response. */
export function validationErrorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message ?? 'Invalid input' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
