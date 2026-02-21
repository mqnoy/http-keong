/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import crypto from 'crypto';
import { HttpKeongConfig } from '../core/config';
import { KeongRequest } from './requests';

/**
 * Base class for all Keong API responses.
 * Provides helper methods to create standardized JSON responses.
 */
export abstract class ApiResponse {
  abstract execute(res: Response): void;

  /**
   * Creates a standardized 200 OK JSON response.
   * @example return ApiResponse.success({ id: 1 });
   */
  static success(data: unknown, message: string = 'Success', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.success, message, data, 200);
  }

  /**
   * Creates a standardized 201 Created JSON response.
   * @example return ApiResponse.created(newUser);
   */
  static created(data: unknown, message: string = 'Created', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.created, message, data, 201);
  }

  /**
   * Creates a standardized Error JSON response.
   * @example return ApiResponse.error('PAYMENT_REQUIRED', 'Balance insufficient', 402);
   */
  static error(code?: string, message: string = 'Error', statusCode: number = 400) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.error, message, null, statusCode);
  }

  /**
   * Creates a standardized 404 Not Found JSON response.
   * @example return ApiResponse.notFound('User not found');
   */
  static notFound(message: string = 'Not Found', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.notFound, message, null, 404);
  }
}

export type ApiResponseData = {
  code: string;
  message: string;
  result: unknown;
};

export const isApiResponseData = (obj: any): obj is ApiResponseData => {
  return typeof obj === 'object' && obj !== null && typeof obj.code === 'string' && typeof obj.message === 'string';
};

export class JsonResponse extends ApiResponse implements ApiResponseData {
  constructor(
    public code: string,
    public message: string,
    public result: unknown,
    public statusCode: number = 200
  ) {
    super();
  }
  execute(res: Response): void {
    const data = this.result;
    const timestamp = new Date().toISOString();
    const checksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(data || {}))
      .digest('hex');

    const req = res.req as KeongRequest;

    const responsePayload = {
      data: data,
      meta: {
        code: this.code,
        message: this.message,
        checksum: checksum,
        timestamp: timestamp,
        ...(HttpKeongConfig.metaExtractor ? HttpKeongConfig.metaExtractor(req) : {}),
      },
    };

    res.status(this.statusCode).json(responsePayload);
  }
}

export class TextResponse extends ApiResponse {
  constructor(
    private text: string,
    private statusCode: number = 200
  ) {
    super();
  }

  execute(res: Response): void {
    res.status(this.statusCode).send(this.text);
  }
}

export class FileResponse extends ApiResponse {
  constructor(
    private filePath: string,
    private downloadName?: string
  ) {
    super();
  }

  execute(res: Response): void {
    if (this.downloadName) {
      res.download(this.filePath, this.downloadName);
    } else {
      res.sendFile(this.filePath);
    }
  }
}

export class RedirectResponse extends ApiResponse {
  constructor(
    private url: string,
    private statusCode: number = 302
  ) {
    super();
  }

  execute(res: Response): void {
    res.redirect(this.statusCode, this.url);
  }
}

export class StatusCodeResponse extends ApiResponse {
  constructor(private statusCode: number) {
    super();
  }

  execute(res: Response): void {
    res.sendStatus(this.statusCode);
  }
}
