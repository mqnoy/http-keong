import 'reflect-metadata';
import { METADATA_KEYS } from '../core/metadata';
import { Request, Response, NextFunction } from 'express';

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Decorator that applies middleware to a controller class or a specific route method.
 * When applied to a class, the middleware will run for all routes within that controller.
 *
 * @param middleware - One or more Express middleware functions.
 * @returns A decorator that can be applied to a Class or a Method.
 *
 * @example
 * ```ts
 * @Middleware(authGuard)
 * @Controller('/admin')
 * class AdminController { ... }
 * ```
 */
export const Middleware = (...middleware: MiddlewareFunction[]): ClassDecorator & MethodDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (target: any, propertyKey?: string | symbol, _descriptor?: any) => {
    const constructor = typeof target === 'function' ? target : target.constructor;

    // If used on a class (propertyKey is undefined)
    if (!propertyKey) {
      const existing = Reflect.getMetadata(METADATA_KEYS.MIDDLEWARE, constructor) || [];
      Reflect.defineMetadata(METADATA_KEYS.MIDDLEWARE, [...existing, ...middleware], constructor);
    } else {
      // If used on a method
      const existing = Reflect.getMetadata(METADATA_KEYS.MIDDLEWARE, constructor, propertyKey) || [];
      Reflect.defineMetadata(METADATA_KEYS.MIDDLEWARE, [...existing, ...middleware], constructor, propertyKey);
    }
  };
};
