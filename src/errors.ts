/**
 * Zetrafi Error Classes
 */

export class ZetrafiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'ZetrafiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthenticationError extends ZetrafiError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ZetrafiError {
  public readonly limit: number;
  public readonly remaining: number;
  public readonly reset: number;
  public readonly type: 'standard' | 'user_action';

  constructor(
    message: string,
    limit: number,
    remaining: number,
    reset: number,
    type: 'standard' | 'user_action' = 'standard'
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { limit, remaining, reset, type });
    this.name = 'RateLimitError';
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
    this.type = type;
  }
}

export class ValidationError extends ZetrafiError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, fields);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class NotFoundError extends ZetrafiError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ZetrafiError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class IpRestrictionError extends ZetrafiError {
  constructor(message: string = 'Only one account per IP allowed for user actions') {
    super(message, 'IP_RESTRICTION', 403);
    this.name = 'IpRestrictionError';
  }
}
