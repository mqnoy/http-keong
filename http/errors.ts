import { Response } from 'express';
import { HttpKeongConfig } from '../core/config';
import { KeongRequest } from './requests';

export class HttpError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public validationErrors?: unknown,
    public httpCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    // Object.setPrototypeOf(this, HttpError.prototype);
    this.code = code;
    this.httpCode = httpCode;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }

  execute(res: Response): void {
    const timestamp = new Date().toISOString();
    const req = res.req as KeongRequest;

    const errorPayload: { data: { errors: unknown }; meta?: Record<string, unknown>; code?: string; message?: string } =
      {
        data: { errors: this.validationErrors },
      };

    if (HttpKeongConfig.isDebug) {
      errorPayload.meta = {
        errorCode: this.code,
        message: `[TACTICAL ALERT] ${this.message}`,
        timestamp: timestamp,
        systemVector: timestamp,
        ...(this.metadata || {}),
        ...(HttpKeongConfig.metaExtractor ? HttpKeongConfig.metaExtractor(req) : {}),
      };
    } else {
      // Basic response for production
      errorPayload.code = this.code;
      errorPayload.message = this.message;
    }

    res.status(this.httpCode).json(errorPayload);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found') {
    super('NOT_FOUND', message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request') {
    super('BAD_REQUEST', message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message);
  }
}

export class ValidationHttpError extends HttpError {
  constructor(message: string = 'Validation Error', errors?: unknown) {
    super('VALIDATION_ERROR', message, errors);
  }
}
