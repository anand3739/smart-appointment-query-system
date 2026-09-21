import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    staffBranchId?: string | null;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication token missing or malformed', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      staffBranchId: decoded.staffBranchId,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.', 401);
    }
    return sendError(res, 'INVALID_TOKEN', 'Invalid authentication token', 401);
  }
}
