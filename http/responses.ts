/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { HttpKeongConfig } from '../core/config';

/**
 * Base class for all Keong API responses.
 * Provides helper methods to create standardized JSON responses.
 */
/**
 * Represents a standardized API response.
 * This class and its subclasses handle the execution of Express responses.
 */
export abstract class ApiResponse {
  /**
   * Executes the response on the given Express response object.
   * @param res - The Express response object.
   */
  abstract execute(res: Response): void;

  /**
   * Creates a standardized 200 OK JSON response.
   * @param data - The data to be returned in the response.
   * @param message - Optional success message.
   * @param code - Optional business logic code (defaults to SUCCESS).
   * @returns A JsonResponse instance.
   * @example return ApiResponse.success({ id: 1 });
   */
  static success(data: unknown, message: string = 'Success', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.success, message, data, 200);
  }

  /**
   * Creates a standardized 201 Created JSON response.
   * @param data - The data to be returned in the response.
   * @param message - Optional success message.
   * @param code - Optional business logic code (defaults to CREATED).
   * @returns A JsonResponse instance.
   * @example return ApiResponse.created(newUser);
   */
  static created(data: unknown, message: string = 'Created', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.created, message, data, 201);
  }

  /**
   * Creates a standardized Error JSON response.
   * @param code - Optional business logic code (defaults to ERROR).
   * @param message - Optional error message.
   * @param statusCode - HTTP status code (default: 400).
   * @returns A JsonResponse instance.
   * @example return ApiResponse.error('PAYMENT_REQUIRED', 'Balance insufficient', 402);
   */
  static error(code?: string, message: string = 'Error', statusCode: number = 400) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.error, message, null, statusCode);
  }

  /**
   * Creates a standardized 404 Not Found JSON response.
   * @param message - Optional not found message.
   * @param code - Optional business logic code (defaults to NOT_FOUND).
   * @returns A JsonResponse instance.
   * @example return ApiResponse.notFound('User not found');
   */
  static notFound(message: string = 'Not Found', code?: string) {
    return new JsonResponse(code || HttpKeongConfig.responseCodes.notFound, message, null, 404);
  }
}

/**
 * Interface representing the structure of a standardized API response.
 */
export type ApiResponseData = {
  /** The actual data payload */
  data: unknown;
  /**
   * Optional metadata about the response.
   * This is only included if HttpKeongConfig.isDebug is true.
   */
  meta?: {
    /** Business logic code */
    code: string;
    /** Response message */
    message: string;
    /** ISO timestamp of the response */
    timestamp?: string;
    /** Base64 checksum of the data payload */
    checksum?: string;
    /** Request ID if generated */
    requestId?: string;
    [key: string]: any;
  };
};

/**
 * Type guard to check if an object is an ApiResponseData.
 * @param obj - The object to check.
 */
export const isApiResponseData = (obj: any): obj is ApiResponseData => {
  return typeof obj === 'object' && obj !== null && (obj.data !== undefined || obj.meta !== undefined);
};

/**
 * Standardized JSON response implementation.
 * Ensures responses follow the { data, meta } structure.
 * @example
 * ```json
 * {
 *  "data": { ... },
 *  "meta": {
 *    "code": "SUCCESS",
 *    "message": "Operation successful",
 *    "timestamp": "2024-02-22T..."
 *  }
 * }
 * ```
 */
export class JsonResponse extends ApiResponse implements ApiResponseData {
  public data: unknown;
  public meta?: ApiResponseData['meta'];

  constructor(
    code: string,
    message: string,
    result: unknown,
    public statusCode: number = 200
  ) {
    super();
    this.data = result;
    this.meta = {
      code,
      message,
    };
  }

  /**
   * Executes the JSON response, appending metadata if debug mode is enabled.
   */
  execute(res: Response): void {
    const req = res.req;
    const extraMeta = HttpKeongConfig.metaExtractor(req);

    const responsePayload: any = {
      data: this.data,
    };

    if (HttpKeongConfig.isDebug) {
      responsePayload.meta = {
        ...this.meta,
        ...extraMeta,
        timestamp: new Date().toISOString(),
      };

      if (!responsePayload.meta.checksum) {
        responsePayload.meta.checksum = Buffer.from(JSON.stringify(this.data || {}))
          .toString('base64')
          .substring(0, 10);
      }
    }

    res.status(this.statusCode).json(responsePayload);
  }
}

/**
 * Class representing a plain text response.
 */
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

/**
 * Class representing a file response (download or serve).
 */
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
