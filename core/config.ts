import { Request } from 'express';

export type MetaExtractor = (req: Request) => Record<string, unknown>;

/**
 * Default metadata extractor that spreads whatever is in req.ctx.
 * This allows the library to be more general and configurable.
 */
export const defaultMetaExtractor: MetaExtractor = (req: Request) => {
  return req.ctx || {};
};

export interface ResponseCodeConfig {
  success: string;
  created: string;
  error: string;
  notFound: string;
}

export const defaultResponseCodes: ResponseCodeConfig = {
  success: 'SUCCESS',
  created: 'CREATED',
  error: 'ERROR',
  notFound: 'NOT_FOUND',
};

/**
 * Global configuration for the http-keong library.
 * This class holds static configuration used by the factory, responses, and errors.
 */
export class HttpKeongConfig {
  /**
   * Business logic codes for different response types.
   * Defaults to: SUCCESS, CREATED, ERROR, NOT_FOUND.
   */
  static responseCodes: ResponseCodeConfig = defaultResponseCodes;

  /**
   * Global metadata extractor for responses and errors.
   * This is called for every JsonResponse and HttpError to enrich the meta object.
   */
  static metaExtractor: MetaExtractor = defaultMetaExtractor;

  /**
   * Global debug flag.
   * When true, responses include a 'meta' object with additional details.
   * Controlled by the HTTP_KEONG_DEBUG environment variable.
   */
  static isDebug: boolean = process.env['HTTP_KEONG_DEBUG'] === 'true';
}
