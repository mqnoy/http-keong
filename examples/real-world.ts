import 'reflect-metadata';
import express from 'express';
import {
  KeongFactory,
  Controller,
  Get,
  Post,
  ApiResponse,
  Middleware,
  ApiTags,
  ApiOperation,
  ApiDocResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiBody,
} from '../index';
import logger from '@mqnoy/lolog';

// --- DTOs (Data Transfer Objects) ---

class UserDto {
  @ApiProperty({ example: 1, description: 'Unique user identifier' })
  id!: number;

  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'Primary email address' })
  email!: string;

  @ApiProperty({ example: 'ADMIN', enum: ['ADMIN', 'USER'], description: 'Security role assigned' })
  role!: string;
}

class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe', required: true })
  name!: string;

  @ApiProperty({ example: 'jane@example.com', required: true })
  email!: string;
}

// --- Domain Models ---
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'ADMIN' },
  { id: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'USER' },
];

// --- Middlewares ---

/**
 * Middleware that authenticates a user and populates req.ctx.
 * In a real app, this would verify a JWT.
 */
const authMiddleware = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  // Simulate authentication
  const authHeader = req.headers.authorization;

  // Attach context that will be automatically included in response metadata
  req.ctx = {
    authenticatedUser: authHeader ? { id: 1, role: 'ADMIN' } : null,
    accessLevel: authHeader ? 'ADMIN' : 'GUEST',
  };

  next();
};

const requestLogger = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  logger.info(`[${req.method}] ${req.path}`);
  next();
};

// --- Controller ---

@ApiTags('Users')
@Controller('/users')
@Middleware(requestLogger)
@Middleware(authMiddleware)
class UserController {
  @Get('/')
  @ApiOperation({ summary: 'Get all users', description: 'Returns a list of all registered users' })
  @ApiDocResponse(200, { description: 'Successful operation', type: [UserDto] })
  getAllUsers() {
    logger.debug('Fetching all users');
    return ApiResponse.success(users);
  }

  @Post('/')
  @ApiBearerAuth()
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Create a new user', description: 'Requires admin privileges' })
  @ApiDocResponse(201, { description: 'User created successfully', type: UserDto })
  @ApiDocResponse(400, { description: 'Invalid input' })
  createUser(req: express.Request) {
    const { name, email } = req.body;

    // Demonstrate context usage in logic
    const currentUser = req.ctx?.['authenticatedUser'];
    if (!currentUser) {
      return ApiResponse.error('UNAUTHORIZED', 'Authenticated user required', 401);
    }

    if (!name || !email) {
      return ApiResponse.error('INVALID_INPUT', 'Name and email are required fields', 400);
    }

    const newUser: User = { id: users.length + 1, name, email, role: 'USER' };
    users.push(newUser);

    return ApiResponse.created(newUser, 'User registered successfully');
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiDocResponse(200, { description: 'User found', type: UserDto })
  @ApiDocResponse(404, { description: 'User not found' })
  getUserById(req: express.Request) {
    const id = parseInt(req.params['id'] as string);
    const user = users.find((u) => u.id === id);

    if (!user) {
      return ApiResponse.notFound(`User with ID ${id} was not found on this system`);
    }

    return ApiResponse.success(user);
  }
}

// --- App Bootstrap ---

const app = KeongFactory.create([UserController], {
  logger: logger,

  // 1. Configure custom business codes (Global)
  responseCodes: {
    success: 'OK_SUCCESS',
    created: 'DATA_CREATED',
    error: 'REQ_FAILED',
    notFound: 'OBJ_NOT_FOUND',
  },

  // 2. Configure metadata extractor (Global)
  // Spreading req.ctx is already the default behavior,
  // but we can transform or add more here.
  metaExtractor: (req) => ({
    ...req.ctx,
    systemName: 'KeongApp-V1',
    serverTime: new Date().toISOString(),
  }),

  // 3. Swagger configuration
  swagger: {
    title: 'Keong Real-World API',
    version: '1.0.0',
    description: 'A comprehensive example demonstrating all features of @mqnoy/http-keong',
    servers: [{ url: 'http://localhost:3000', description: 'Local Dev Enviroment' }],
  },

  // 4. Custom Express configuration
  customConfiguration: (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    logger.info('Custom Express configuration complete');
  },

  // 5. Global Error Handler
  errorHandler: (err, _req, res, _next) => {
    logger.error('Unexpected error:', err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end',
      error: process.env['NODE_ENV'] === 'development' ? err.message : undefined,
    });
  },
});

const PORT = process.env['PORT'] || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🐌 Keong server is crawling at http://localhost:${PORT}`);
  logger.info(`📖 Documentation available at http://localhost:${PORT}/api-docs`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please use a different port or kill the process using this port.`);
    process.exit(1);
  } else {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
});
