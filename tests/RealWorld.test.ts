import request from 'supertest';
import express from 'express';
import {
  KeongFactory,
  Controller,
  Get,
  Post,
  ApiResponse,
  Middleware,
  ApiTags,
  ApiDocResponse,
  ApiProperty,
  HttpKeongConfig,
} from '../index';

// Arrange: Define DTOs and Controllers
class ItemDto {
  @ApiProperty({ example: 1 })
  id!: number;
  @ApiProperty({ example: 'Item 1' })
  name!: string;
}

@ApiTags('Items')
@Controller('/items')
class ItemController {
  private items = [{ id: 1, name: 'Item 1' }];

  @Get('/')
  @ApiDocResponse(200, { type: [ItemDto] })
  getAll() {
    return ApiResponse.success(this.items);
  }

  @Post('/')
  @Middleware((req, res, next) => {
    if (!req.body['name']) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    next();
  })
  create(req: express.Request) {
    const newItem = { id: this.items.length + 1, name: req.body['name'] };
    this.items.push(newItem);
    return ApiResponse.created(newItem);
  }
}

describe('Real World Integration', () => {
  let app: express.Application;

  const createApp = (isDebug: boolean = true) => {
    HttpKeongConfig.isDebug = isDebug;
    return KeongFactory.create([ItemController], {
      swagger: {},
      customConfiguration: (expressApp) => {
        expressApp.use(express.json());
      },
    });
  };

  describe('GET /items', () => {
    it('should return a list of items with meta in debug mode', async () => {
      // Arrange
      app = createApp(true);

      // Act
      const response = await request(app).get('/items');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta.code).toBe('SUCCESS');
    });

    it('should return a list of items without meta in production mode', async () => {
      // Arrange
      app = createApp(false);

      // Act
      const response = await request(app).get('/items');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeUndefined();
    });
  });

  describe('POST /items', () => {
    it('should create a new item when valid data is provided', async () => {
      // Arrange
      app = createApp(true);

      // Act
      const response = await request(app).post('/items').send({ name: 'New Item' });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('New Item');
      expect(response.body.meta.code).toBe('CREATED');
    });

    it('should return 400 when custom middleware validation fails', async () => {
      // Arrange
      app = createApp(true);

      // Act
      const response = await request(app).post('/items').send({});

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing name');
    });
  });

  describe('Swagger UI', () => {
    it('should expose swagger documentation at /api-docs', async () => {
      // Arrange
      app = createApp(true);

      // Act
      const response = await request(app).get('/api-docs/');

      // Assert
      expect(response.status).toBe(200);
      expect(response.text).toContain('swagger-ui');
    });
  });
});
