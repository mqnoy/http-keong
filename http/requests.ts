import { Request } from 'express';

export interface KeongRequest<T = Record<string, any>> extends Request {
  ctx?: T;
}
