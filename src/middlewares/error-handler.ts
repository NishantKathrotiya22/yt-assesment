import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof QueryFailedError) {
    const driverError = (err as unknown as { driverError?: { code?: string } }).driverError;
    if (driverError?.code === POSTGRES_UNIQUE_VIOLATION) {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists.' },
      });
      return;
    }
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong on our end.' },
  });
}
