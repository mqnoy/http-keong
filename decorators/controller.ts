import 'reflect-metadata';
import { METADATA_KEYS } from '../core/metadata';

/**
 * Decorator that marks a class as a controller and defines its base route path.
 *
 * @param prefix - The base URL path for all routes defined within this controller.
 * @returns A ClassDecorator.
 *
 * @example
 * ```ts
 * @Controller('/users')
 * class UserController { ... }
 * ```
 */
export const Controller = (prefix: string = ''): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(METADATA_KEYS.CONTROLLER_PATH, prefix, target);
  };
};
