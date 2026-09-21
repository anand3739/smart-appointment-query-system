import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { sendError } from '../utils/apiResponse';

export function authorize(allowedRoles: ('CUSTOMER' | 'STAFF' | 'ADMIN')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'FORBIDDEN',
        `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        403
      );
    }

    next();
  };
}
