import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { ApiError } from '../utils/ApiError';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError('AUTH_TOKEN_MISSING'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return next(new ApiError('AUTH_TOKEN_EXPIRED'));
    }
    next(new ApiError('AUTH_TOKEN_INVALID'));
  }
}
