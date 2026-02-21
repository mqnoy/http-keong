import request from 'supertest';
import { KeongFactory } from '../core/factory';
import { Controller } from '../decorators/controller';
import { Get } from '../decorators/methods';
import { ApiResponse } from '../http/responses';
import { HttpKeongConfig } from '../core/config';

// Mocking lolog to avoid dependency issues during tests if not built
jest.mock('@mqnoy/lolog', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

@Controller('/test')
class TestController {
  @Get('/hello')
  hello() {
    return { message: 'hello' };
  }

  @Get('/response')
  response() {
    return ApiResponse.success({ data: 'ok' });
  }
}

describe('KeongFactory', () => {
  it('should create an express application with registered routes', async () => {
    // Arrange
    const controllers = [TestController];
    const options = {
      customConfiguration: (_app: any) => {},
    };

    // Act
    const app = KeongFactory.create(controllers, options);

    // Assert
    const response = await request(app).get('/test/hello');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'hello' });
  });

  it('should handle ApiResponse correctly', async () => {
    // Arrange
    const controllers = [TestController];
    const options = {
      customConfiguration: (_app: any) => {},
    };

    // Act
    const app = KeongFactory.create(controllers, options);

    // Assert
    const response = await request(app).get('/test/response');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: { data: 'ok' },
      meta: {
        code: 'SUCCESS',
        message: 'Success',
        checksum: expect.any(String),
        timestamp: expect.any(String),
      },
    });
  });

  it('should use the provided logger for debug and info messages', async () => {
    // Arrange
    const mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
    const controllers = [TestController];
    const options = {
      customConfiguration: (_app: any) => {},
      logger: mockLogger as any,
    };

    // Act
    HttpKeongConfig.isDebug = true;
    KeongFactory.create(controllers, options);

    // Assert
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Registered Endpoints'));
  });

  it('should execute custom configuration', async () => {
    // Arrange
    const controllers = [TestController];
    const customConfig = jest.fn();
    const options = {
      customConfiguration: customConfig,
    };

    // Act
    KeongFactory.create(controllers, options);

    // Assert
    expect(customConfig).toHaveBeenCalled();
  });
});
