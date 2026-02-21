import 'reflect-metadata';
import { METADATA_KEYS } from '../core/metadata';

export interface RouteDefinition {
  path: string;
  requestMethod: 'get' | 'post' | 'put' | 'delete' | 'patch';
  methodName: string | symbol;
}

const createMethodDecorator = (method: RouteDefinition['requestMethod']) => {
  return (path: string = ''): MethodDecorator => {
    return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
      const constructor = target.constructor;
      // target.constructor is the class
      // propertyKey is the method name
      // descriptor is the method
      // console.debug(`createMethodDecorator: `, target, '-', propertyKey, '-', descriptor);
      if (!Reflect.hasMetadata(METADATA_KEYS.METHOD_ROUTES, constructor)) {
        const emptyRoutes: RouteDefinition[] = [];
        Reflect.defineMetadata(METADATA_KEYS.METHOD_ROUTES, emptyRoutes, constructor);
      }

      const routes: RouteDefinition[] = Reflect.getMetadata(METADATA_KEYS.METHOD_ROUTES, constructor) || [];
      routes.push({
        path,
        requestMethod: method,
        methodName: propertyKey,
      });

      Reflect.defineMetadata(METADATA_KEYS.METHOD_ROUTES, routes, constructor);
    };
  };
};

/**
 * Decorator that defines a GET route.
 * @param path - The URL path for this route (relative to the controller prefix).
 * @example
 * ```ts
 * @Get('/users')
 * getAll() {}
 * ```
 */
export const Get = createMethodDecorator('get');

/**
 * Decorator that defines a POST route.
 * @param path - The URL path for this route (relative to the controller prefix).
 * @example
 * ```ts
 * @Post('/users')
 * create() {}
 * ```
 */
export const Post = createMethodDecorator('post');

/**
 * Decorator that defines a PUT route.
 * @param path - The URL path for this route (relative to the controller prefix).
 * @example
 * ```ts
 * @Put('/users/:id')
 * update() {}
 * ```
 */
export const Put = createMethodDecorator('put');

/**
 * Decorator that defines a DELETE route.
 * @param path - The URL path for this route (relative to the controller prefix).
 * @example
 * ```ts
 * @Delete('/users/:id')
 * remove() {}
 * ```
 */
export const Delete = createMethodDecorator('delete');

/**
 * Decorator that defines a PATCH route.
 * @param path - The URL path for this route (relative to the controller prefix).
 * @example
 * ```ts
 * @Patch('/users/:id')
 * modify() {}
 * ```
 */
export const Patch = createMethodDecorator('patch');
