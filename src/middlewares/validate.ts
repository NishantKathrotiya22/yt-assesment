import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectSchema } from 'joi';
import { ApiError } from '../utils/ApiError';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ObjectSchema, target: Target = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(new ApiError('VALIDATION_ERROR', undefined, details));
    }

    if (target === 'query') {
      // Express 4's `req.query` is a getter with no setter — a plain `req.query = value`
      // throws under "use strict". Replace the property descriptor instead.
      Object.defineProperty(req, 'query', { value, writable: true, configurable: true, enumerable: true });
    } else {
      req[target] = value;
    }

    next();
  };
}
