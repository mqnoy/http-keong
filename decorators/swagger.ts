import 'reflect-metadata';
import { METADATA_KEYS } from '../core/metadata';

/**
 * Global registry for Swagger schemas generated from @ApiProperty
 */
export const SWAGGER_SCHEMA_REGISTRY: Record<string, any> = {};

export interface ApiPropertyOptions {
  type?: any;
  description?: string;
  example?: any;
  required?: boolean;
  enum?: any[];
  items?: any;
}

/**
 * Decorator to define a property in a Swagger schema (DTO).
 * Uses reflect-metadata to auto-detect types if possible.
 *
 * @example
 * ```ts
 * class UserDto {
 *   @ApiProperty({ example: 'John Doe', required: true })
 *   name!: string;
 * }
 * ```
 */
export const ApiProperty = (options: ApiPropertyOptions = {}): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const className = target.constructor.name;
    if (!SWAGGER_SCHEMA_REGISTRY[className]) {
      SWAGGER_SCHEMA_REGISTRY[className] = {
        type: 'object',
        properties: {},
        required: [],
      };
    }

    const schema = SWAGGER_SCHEMA_REGISTRY[className];
    const designType = Reflect.getMetadata('design:type', target, propertyKey);

    let swaggerType = 'string';
    if (designType === Number) swaggerType = 'number';
    else if (designType === Boolean) swaggerType = 'boolean';
    else if (designType === Array) swaggerType = 'array';
    else if (designType === Date) {
      schema.properties[propertyKey as string] = {
        type: 'string',
        format: 'date-time',
        ...options,
      };
      return;
    }

    const propertySchema: any = {
      type: options.type || swaggerType,
      description: options.description,
      example: options.example,
      enum: options.enum,
    };

    if (options.items) propertySchema.items = options.items;

    // Handle nested schemas if type is a class
    if (typeof options.type === 'function' && options.type.name !== 'Object') {
      propertySchema.$ref = `#/components/schemas/${options.type.name}`;
      delete propertySchema.type;
    }

    schema.properties[propertyKey as string] = propertySchema;

    if (options.required) {
      if (!schema.required.includes(propertyKey as string)) {
        schema.required.push(propertyKey as string);
      }
    }
  };
};

/**
 * Decorator that adds Swagger tags to a controller.
 *
 * @param tags - One or more tag names to group routes in the Swagger UI.
 *
 * @example
 * ```ts
 * @ApiTags('Users', 'Authentication')
 * @Controller('/users')
 * class UserController {}
 * ```
 */
export const ApiTags = (...tags: string[]): ClassDecorator => {
  return (target: Function) => {
    Reflect.defineMetadata(METADATA_KEYS.SWAGGER_TAGS, tags, target);
  };
};

export interface SwaggerOperationOptions {
  summary?: string;
  description?: string;
  responses?: Record<string, any>;
  requestBody?: any;
  parameters?: any[];
  security?: any[];
  deprecated?: boolean;
}

/**
 * Decorator that defines Swagger operation details for a specific route.
 *
 * @param options - Configuration for the operation (summary, description, etc.).
 *
 * @example
 * ```ts
 * @Get('/')
 * @ApiOperation({ summary: 'Get all users' })
 * getAll() {}
 * ```
 */
export const ApiOperation = (options: SwaggerOperationOptions): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, target.constructor, propertyKey) || {};
    Reflect.defineMetadata(METADATA_KEYS.SWAGGER_DOCS, { ...existing, ...options }, target.constructor, propertyKey);
  };
};

/**
 * Decorator that defines the Swagger request body schema for a route.
 *
 * @param options - Configuration for the request body (DTO type and description).
 *
 * @example
 * ```ts
 * @Post('/')
 * @ApiBody({ type: CreateUserDto })
 * create() {}
 * ```
 */
export const ApiBody = (options: { type: any; description?: string }): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, target.constructor, propertyKey) || {};
    const typeName = options.type.name;

    const requestBody = {
      description: options.description || '',
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${typeName}` },
        },
      },
    };

    Reflect.defineMetadata(METADATA_KEYS.SWAGGER_DOCS, { ...existing, requestBody }, target.constructor, propertyKey);
  };
};

/**
 * Decorator that defines a Swagger response for a route.
 *
 * @param status - The HTTP status code (e.g., 200, 201, 404).
 * @param options - The response definition (description and optional DTO type).
 *
 * @example
 * ```ts
 * @Get('/:id')
 * @ApiDocResponse(200, { description: 'User found', type: UserDto })
 * @ApiDocResponse(404, 'User not found')
 * getOne() {}
 * ```
 */
export const ApiDocResponse = (status: number, options: any): MethodDecorator => {
  return (target: object, propertyKey: string | symbol, _descriptor: PropertyDescriptor) => {
    const existing = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, target.constructor, propertyKey) || {};
    const responses = existing.responses || {};

    let responseObj: any = {};
    if (typeof options === 'string') {
      responseObj = { description: options };
    } else {
      responseObj = { ...options };
      if (options.type) {
        const isArray = Array.isArray(options.type);
        const actualType = isArray ? options.type[0] : options.type;
        const typeName = actualType.name;

        const schema = isArray
          ? { type: 'array', items: { $ref: `#/components/schemas/${typeName}` } }
          : { $ref: `#/components/schemas/${typeName}` };

        responseObj.content = {
          'application/json': { schema },
        };
        delete responseObj.type;
      }
    }

    responses[status.toString()] = responseObj;
    Reflect.defineMetadata(METADATA_KEYS.SWAGGER_DOCS, { ...existing, responses }, target.constructor, propertyKey);
  };
};

/**
 * Decorator that marks a route or a controller as requiring Bearer authentication (JWT).
 */
export const ApiBearerAuth = (): ClassDecorator & MethodDecorator => {
  return (target: any, propertyKey?: string | symbol, _descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      // Method decorator
      const constructor = target.constructor;
      const existing = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, constructor, propertyKey) || {};
      const security = existing.security || [];
      security.push({ bearerAuth: [] });
      Reflect.defineMetadata(METADATA_KEYS.SWAGGER_DOCS, { ...existing, security }, constructor, propertyKey);
    } else {
      // Class decorator
      const existing = Reflect.getMetadata(METADATA_KEYS.SWAGGER_DOCS, target) || {};
      const security = existing.security || [];
      security.push({ bearerAuth: [] });
      Reflect.defineMetadata(METADATA_KEYS.SWAGGER_DOCS, { ...existing, security }, target);
    }
  };
};
