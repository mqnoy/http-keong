import { Response } from 'express';
import { HttpKeongConfig } from '../core/config';

/**
 * Base class for all Keong HTTP errors.
 * Automatically handles standard API error response formatting.
 */
export class HttpError extends Error {
  /**
   * @param code - Internal business logic error code.
   * @param message - Human-readable error message.
   * @param validationErrors - Optional object containing validation failure details.
   * @param httpCode - HTTP status code (default: 500).
   * @param metadata - Additional metadata to be included in debug mode.
   */
  constructor(
    public code: string,
    public override message: string,
    public validationErrors?: unknown,
    public httpCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.httpCode = httpCode;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Executes the error response, formatting it according to the debug state.
   */
  execute(res: Response): void {
    const errorPayload: { data: { errors: unknown }; meta?: Record<string, unknown>; code?: string; message?: string } =
      {
        data: { errors: this.validationErrors },
      };

    if (HttpKeongConfig.isDebug) {
      errorPayload.meta = {
        errorCode: this.code,
        ...(this.metadata || {}),
        ...(HttpKeongConfig.metaExtractor ? HttpKeongConfig.metaExtractor(res.req) : {}),
      };
    } else {
      // Basic response for production
      errorPayload.code = this.code;
      errorPayload.message = this.message;
    }

    res.status(this.httpCode).json(errorPayload);
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super('NOT_FOUND', message, undefined, 404);
  }
}

/**
 * Thrown when a request is malformed (400).
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super('BAD_REQUEST', message, undefined, 400);
  }
}

/**
 * Thrown when authentication is required (401).
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, undefined, 401);
  }
}

/**
 * Thrown when access is forbidden (403).
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, undefined, 403);
  }
}

/**
 * Thrown when validation fails (422).
 */
export class ValidationHttpError extends HttpError {
  constructor(message: string = 'Validation Error', errors?: unknown) {
    super('VALIDATION_ERROR', message, errors, 422);
  }
}
