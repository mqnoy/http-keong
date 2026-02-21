/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { RouteDefinition } from '../decorators/methods';
import { ApiResponse, isApiResponseData } from '../http/responses';
import { METADATA_KEYS } from './metadata';
import { HttpKeongConfig, MetaExtractor, ResponseCodeConfig } from './config';
import { SWAGGER_SCHEMA_REGISTRY } from '../decorators/swagger';

export type Constructor<T = object> = new (...args: any[]) => T;

export interface DIContainer {
  resolve<T>(target: Constructor<T>): T;
}

export type ErrorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void;

export interface SwaggerOptions {
  path?: string;
  title?: string;
  version?: string;
  description?: string;
  servers?: { url: string; description?: string }[];
}

export interface ILogger {
  info(msg: string, ...args: unknown[]): void;
  info(obj: object, msg?: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  warn(obj: object, msg?: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  error(obj: object, msg?: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
  debug(obj: object, msg?: string, ...args: unknown[]): void;
  trace(msg: string, ...args: unknown[]): void;
  trace(obj: object, msg?: string, ...args: unknown[]): void;
  fatal(msg: string, ...args: unknown[]): void;
  fatal(obj: object, msg?: string, ...args: unknown[]): void;
}

export interface KeongFactoryOptions {
  container?: DIContainer;
  errorHandler?: ErrorHandler;
  fallbackHandler?: express.Handler;
  customConfiguration: (app: express.Application) => void;
  swagger?: SwaggerOptions;
  logger?: ILogger;
  metaExtractor?: MetaExtractor;
  responseCodes?: Partial<ResponseCodeConfig>;
}

export class KeongFactory {
  /**
   * Bootstraps a new Keong application by registering controllers and applying configurations.
   *
   * @param controllers - An array of controller classes marked with the @Controller decorator.
   * @param options - Configuration options for the application (logger, swagger, DI, etc.).
   * @returns A fully configured Express application.
   *
   * @example
   * ```ts
   * const app = KeongFactory.create([UserController], {
   *   swagger: { title: 'My API' }
   * });
   * ```
   */
  static create(controllers: Constructor[], options: KeongFactoryOptions): express.Application {
    if (options.metaExtractor) {
      HttpKeongConfig.metaExtractor = options.metaExtractor;
    }

    if (options.responseCodes) {
      HttpKeongConfig.responseCodes = {
        ...HttpKeongConfig.responseCodes,
        ...options.responseCodes,
      };
    }

    const logger = options.logger;
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    options.customConfiguration(app);

    const registeredRoutes: { method: string; path: string; controller: string; handler: string }[] = [];

    for (const controllerClass of controllers) {
      const instance = options.container ? options.container.resolve(controllerClass) : new controllerClass();

      const prefix = Reflect.getMetadata(METADATA_KEYS.CONTROLLER_PATH, controllerClass) || '';
      const routes: RouteDefinition[] = Reflect.getMetadata(METADATA_KEYS.METHOD_ROUTES, controllerClass) || [];

      const router = express.Router();

      // Class level middleware
      const classMiddleware = Reflect.getMetadata(METADATA_KEYS.MIDDLEWARE, controllerClass) || [];
      if (classMiddleware.length > 0) {
        router.use(classMiddleware);
      }

      for (const route of routes) {
        const instanceAny = instance as any;
        const routeHandler = instanceAny[route.methodName];
        if (!routeHandler) continue;
        const boundHandler = routeHandler.bind(instance);
        const methodMiddleware = Reflect.getMetadata(METADATA_KEYS.MIDDLEWARE, controllerClass, route.methodName) || [];

        const wrapper = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
          try {
            if (res.headersSent) return;

            const result = await boundHandler(req, res, next);

            if (result instanceof ApiResponse) {
              result.execute(res);
              return;
            }

            if (isApiResponseData(result)) {
              res.status(200).json(result);
              return;
            }

            if (typeof result === 'object') {
              res.json(result);
              return;
            }

            if (typeof result === 'string') {
              res.send(result);
              return;
            }

            if (typeof result === 'number') {
              res.status(result).end();
              return;
            }

            return next();
          } catch (error) {
            next(error);
          }
        };

        (router as any)[route.requestMethod](route.path, ...methodMiddleware, wrapper);

        const fullPath = `${prefix}${route.path}`.replace(/\/+/g, '/');
        registeredRoutes.push({
          method: route.requestMethod.toUpperCase(),
          path: fullPath === '' ? '/' : fullPath,
          controller: controllerClass.name,
          handler: String(route.methodName),
        });
      }

      app.use(prefix, router);
    }

    if (registeredRoutes.length > 0 && HttpKeongConfig.isDebug) {
      this.printRouteTable(registeredRoutes, logger);
    }

    if (options.swagger) {
      const swaggerSpec = this.generateSwaggerSpec(controllers, options.swagger);
      const swaggerPath = options.swagger.path || '/api-docs';
      app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      logger?.info(`Swagger UI is available at ${swaggerPath}`);
    }

    if (options.fallbackHandler) {
      app.use(options.fallbackHandler);
    }

    if (options.errorHandler) {
      app.use(options.errorHandler);
    }

    return app;
  }

  private static generateSwaggerSpec(controllers: any[], options: SwaggerOptions): any {
    const spec: any = {
      openapi: '3.0.0',
      info: {
        title: options.title || 'API Documentation',
        version: options.version || '1.0.0',
        description: options.description || '',
      },
      servers: options.servers || [{ url: '/' }],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: { ...SWAGGER_SCHEMA_REGISTRY },
      },
    };

    for (const controllerClass of controllers) {
      const prefix = Reflect.getMetadata(METADATA_KEYS.CONTROLLER_PATH, controllerClass) || '';
      const classTags = Reflect.getMetadata(METADATA_KEYS.SWAGGER_TAGS, controllerClass) || [];
      const classSecurity = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, controllerClass)?.security || [];
      const routes: RouteDefinition[] = Reflect.getMetadata(METADATA_KEYS.METHOD_ROUTES, controllerClass) || [];

      for (const route of routes) {
        const swaggerDocs = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, controllerClass, route.methodName) || {};

        let fullPath = (prefix + route.path).replace(/\/+/g, '/');
        if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;
        const swaggerPath = fullPath.replace(/:(\w+)/g, '{$1}');

        if (!spec.paths[swaggerPath]) {
          spec.paths[swaggerPath] = {};
        }

        const operation: any = {
          tags: classTags,
          summary: swaggerDocs.summary || '',
          description: swaggerDocs.description || '',
          operationId: `${controllerClass.name}_${route.methodName.toString()}`,
          parameters: swaggerDocs.parameters || [],
          responses: swaggerDocs.responses || {
            ['200']: { description: 'Success' },
          },
        };

        if (swaggerDocs.requestBody) {
          operation.requestBody = swaggerDocs.requestBody;
        }

        const security = [...classSecurity, ...(swaggerDocs.security || [])];
        if (security.length > 0) {
          operation.security = security;
        }

        // Extract path parameters from route path if not explicitly provided
        const pathParams = route.path.match(/:(\w+)/g);
        if (pathParams) {
          pathParams.forEach((p) => {
            const paramName = p.substring(1);
            if (!operation.parameters.find((param: any) => param.name === paramName && param.in === 'path')) {
              operation.parameters.push({
                name: paramName,
                in: 'path',
                required: true,
                schema: { type: 'string' },
              });
            }
          });
        }

        spec.paths[swaggerPath][route.requestMethod] = operation;
      }
    }

    return spec;
  }

  private static printRouteTable(routes: any[], logger?: ILogger) {
    const colors = {
      RESET: '\x1b[0m',
      BOLD: '\x1b[1m',
      GREEN: '\x1b[32m',
      CYAN: '\x1b[36m',
      YELLOW: '\x1b[33m',
      RED: '\x1b[31m',
      MAGENTA: '\x1b[35m',
      GRAY: '\x1b[90m',
    };

    const methodColors: any = {
      GET: colors.GREEN,
      POST: colors.CYAN,
      PUT: colors.YELLOW,
      DELETE: colors.RED,
      PATCH: colors.MAGENTA,
    };

    const header = `${colors.BOLD}${'METHOD'.padEnd(10)} ${'PATH'.padEnd(30)} ${'CONTROLLER'.padEnd(20)} ${'HANDLER'}${
      colors.RESET
    }`;
    const separator = `${colors.GRAY}${'-'.repeat(80)}${colors.RESET}`;

    let output = `\n${colors.BOLD}🐌 Registered Endpoints:${colors.RESET}\n${separator}\n${header}\n${separator}\n`;

    for (const route of routes) {
      const methodColor = methodColors[route.method] || colors.RESET;
      const row = `${methodColor}${colors.BOLD}${route.method.padEnd(10)}${colors.RESET} ${colors.BOLD}${route.path.padEnd(
        30
      )}${colors.RESET} ${colors.GRAY}${route.controller.padEnd(20)}${colors.RESET} ${colors.GRAY}${route.handler}${
        colors.RESET
      }`;
      output += `${row}\n`;
    }

    output += `${separator}\n`;

    if (logger) {
      logger.info(output);
    } else {
      console.log(output);
    }
  }
}
