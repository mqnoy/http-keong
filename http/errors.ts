import { Response } from 'express';
import { HttpKeongConfig } from '../core/config';

/**
 * Base class for all Keong HTTP errors.
 * Automatically handles standard API error response formatting.
 */
export class HttpError extends Error {
  /**
   * @param message - Human-readable error message.
   * @param code - Internal business logic error code.
   * @param httpCode - HTTP status code (default: 500).
   * @param validationErrors - Optional object containing validation failure details.
   * @param metadata - Additional metadata to be included in debug mode.
   */
  constructor(
    public override message: string,
    public code: string,
    public httpCode: number = 500,
    public validationErrors?: unknown,
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
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * Thrown when a request is malformed (400).
 */
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super(message, 'BAD_REQUEST', 400);
  }
}

/**
 * Thrown when authentication is required (401).
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Thrown when access is forbidden (403).
 */
export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * Thrown when validation fails (422).
 */
export class ValidationHttpError extends HttpError {
  constructor(message: string = 'Validation Error', errors?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, errors);
  }
}
