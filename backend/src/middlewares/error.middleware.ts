import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled Error:', err);

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'UNAUTHORIZED', 'Invalid or missing credentials', 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';
  const code = err.code || 'INTERNAL_ERROR';

  return sendError(res, code, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : undefined);
}
