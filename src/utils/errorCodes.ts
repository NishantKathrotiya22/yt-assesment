export const ErrorCodes = {
  VALIDATION_ERROR: { status: 400, message: 'Some fields need your attention.' },

  AUTH_INVALID_CREDENTIALS: { status: 401, message: "That email and password don't match our records." },
  AUTH_TOKEN_MISSING: { status: 401, message: 'You need to be logged in to do that.' },
  AUTH_TOKEN_INVALID: { status: 401, message: 'Your session is invalid. Please log in again.' },
  AUTH_TOKEN_EXPIRED: { status: 401, message: 'Your session has expired. Please log in again.' },
  AUTH_REFRESH_TOKEN_INVALID: { status: 401, message: 'Your session could not be refreshed. Please log in again.' },
  AUTH_REFRESH_TOKEN_REUSED: {
    status: 401,
    message: 'Your session was revoked for security reasons. Please log in again.',
  },
  AUTH_FORBIDDEN: { status: 403, message: "You don't have permission to do that." },

  USER_NOT_FOUND: { status: 404, message: "We couldn't find that user." },
  VIDEO_NOT_FOUND: { status: 404, message: "We couldn't find that video. It may have been removed." },
  COMMENT_NOT_FOUND: { status: 404, message: "We couldn't find that comment." },
  UPLOAD_SESSION_NOT_FOUND: { status: 404, message: "We couldn't find that upload session." },
  ROUTE_NOT_FOUND: { status: 404, message: 'This endpoint does not exist.' },

  DUPLICATE_EMAIL: { status: 409, message: 'An account with this email already exists.' },
  UPLOAD_SESSION_INVALID_STATE: { status: 409, message: 'This upload has already been completed or aborted.' },

  UPLOAD_PART_MISMATCH: { status: 400, message: "The uploaded parts don't match what we have on record." },
  FILE_TOO_LARGE: { status: 400, message: 'That file is larger than what we allow.' },

  S3_OPERATION_FAILED: { status: 502, message: 'We had trouble talking to storage. Please try again.' },
  RATE_LIMITED: { status: 429, message: 'Too many requests. Please slow down and try again shortly.' },
  INTERNAL_SERVER_ERROR: { status: 500, message: 'Something went wrong on our end.' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
