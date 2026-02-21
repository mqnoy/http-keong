import { KeongRequest } from '../http/requests';

export type MetaExtractor = (req: KeongRequest) => Record<string, unknown>;

/**
 * Default metadata extractor that spreads whatever is in req.ctx.
 * This allows the library to be more general and configurable.
 */
export const defaultMetaExtractor: MetaExtractor = (req: KeongRequest) => {
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

export class HttpKeongConfig {
  /**
   * Business logic codes for different response types.
   */
  static responseCodes: ResponseCodeConfig = defaultResponseCodes;

  /**
   * Global metadata extractor for responses and errors.
   */
  static metaExtractor: MetaExtractor = defaultMetaExtractor;

  /**
   * Global debug flag.
   */
  static isDebug: boolean = process.env['HTTP_KEONG_DEBUG'] === 'true';
}
