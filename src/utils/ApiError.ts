import { ErrorCode, ErrorCodes } from './errorCodes';

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: FieldError[];

  constructor(code: ErrorCode, message?: string, details?: FieldError[]) {
    const definition = ErrorCodes[code];
    super(message ?? definition.message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = definition.status;
    this.details = details;
    Error.captureStackTrace(this, ApiError);
  }
}
