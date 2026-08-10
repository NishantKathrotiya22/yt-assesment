import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User.entity';
import { ApiError } from '../utils/ApiError';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError('AUTH_TOKEN_MISSING'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('AUTH_FORBIDDEN'));
    }
    next();
  };
}
