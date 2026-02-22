import { KeongContext } from '../core/context';

declare module 'express-serve-static-core' {
  interface Request {
    ctx: KeongContext;
  }
}

// Also augment Express namespace just in case
declare global {
  namespace Express {
    interface Request {
      ctx: KeongContext;
    }
  }
}

export {};
