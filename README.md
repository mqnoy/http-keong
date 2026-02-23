<div align="center">
  <img src="./assets/logo.png" alt="http-ke@ng" width="512">
  <h1>http-ke@ng: Express.js Wrapper with SwaggerUI</h1>
  <h3>Light. Steady. Protected.</h3>
</div>

---
`http-keong` is a developer-friendly, decorator-powered wrapper for Express.js. It brings the architectural elegance of frameworks like NestJS to the lightweight Express ecosystem, featuring automatic **Swagger UI generation**, **Standardized JSON Responses**, and **Context-Aware Request Augmentation**.

---

## 🐚 Why "Keong"?

In Indonesian, **Keong** means snail. This library isn't about being slow; it's about carrying your "shell" (your protection and logic) with you everywhere.
- **Steady**: High-quality code structure using TypeScript decorators.
- **Lightweight**: Zero fluff, just a thin, powerful layer over Express.
- **Protected**: Encapsulation of routes, middlewares, and documentation.
- **Progressive**: Built for engineers who want clean code without complex boilerplate.

---

## 🚀 Quick Start

### 1. Installation

```bash
pnpm install @mqnoy/http-keong reflect-metadata express
```

### 2. Configure TypeScript

Enable decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. Build your first Controller

```typescript
import 'reflect-metadata';
import { KeongFactory, Controller, Get, ApiResponse } from '@mqnoy/http-keong';

@Controller('/hello')
class HelloController {
  @Get('/')
  index() {
    // Standardized response with data and metadata
    return ApiResponse.success({ message: 'Hello World!' });
  }
}

const app = KeongFactory.create([HelloController], {
  swagger: { title: 'My Awesome API' }
});

app.listen(3000, () => console.log('🐌 Keong is crawling at http://localhost:3000'));
```

---

## ✨ Core Features

### 🛤 Decorator-Based Routing
Clean and intuitive routing using class and method decorators.
- `@Controller(prefix)`: Define base paths.
- `@Get(path)`, `@Post(path)`, `@Put(path)`, `@Delete(path)`, `@Patch(path)`: Standard HTTP verbs.

### 🛡 Middleware Integration
Apply cross-cutting concerns at the class level or individual route level.
```typescript
@Middleware(loggerMiddleware)
@Controller('/users')
class UserController {
  @Post('/')
  @Middleware(authGuard)
  create() { ... }
}
```

### 📖 Automated Swagger Documentation
Stop writing documentation manually. `http-keong` generates a full OpenAPI spec from your code.
- `@ApiTags()`: Group your routes.
- `@ApiOperation()`: Add summaries and descriptions.
- `@ApiBody({ type: MyDto })`: Document request payloads.
- `@ApiDocResponse(status, options)`: Document expected responses.
- `@ApiBearerAuth()`: Flag secure routes in Swagger UI.

### 📦 Type-Safe DTOs
Use `@ApiProperty` to define your data structures. These are automatically converted into Swagger schemas.
```typescript
class UserDto {
  @ApiProperty({ example: 'John Doe', required: true })
  name!: string;

  @ApiProperty({ example: 25, description: 'Age in years' })
  age!: number;
}
```

### 💎 Standardized JSON Responses & Errors
The specialized `ApiResponse` class ensures your API always speaks the same language. All response and error helpers follow a **"Message First"** convention for better readability.

#### 1. Success Responses
Use static helpers for consistent data delivery.

```typescript
// Simple success (Defaults: message="Success", code="SUCCESS")
return ApiResponse.success({ id: 1 }); 

// Custom message and business code
return ApiResponse.success(data, 'User updated successfully', 'UPDATE_OK');
```

#### 2. Error Handling
You can throw built-in error classes or return an error response manually.

```typescript
// Standard Errors (message first)
throw new NotFoundError('User profile not found');
throw new ValidationHttpError('Invalid payload', { email: 'is required' });

// Generic Error Helper
return ApiResponse.error('Connection timed out', 'GATEWAY_ERROR', 504);
```

**Production Format (Default)**:
```json
{
  "data": { "id": 1, "name": "John Doe" }
}
```

**Debug Format (`HTTP_KEONG_DEBUG=true`)**:
```json
{
  "data": { "id": 1, "name": "John Doe" },
  "meta": {
    "code": "SUCCESS",
    "message": "Operation successful",
    "checksum": "a1b2c3d4e5",
    "timestamp": "2024-02-22T20:00:00.000Z",
    "requestId": "uuid-v4-abc"
  }
}
```

### 🛠 Configuration & Debug Mode
You can enable debug mode to see detailed metadata in your responses.

```bash
# Enable debug mode via environment variable
HTTP_KEONG_DEBUG=true pnpm run dev
```

When `HTTP_KEONG_DEBUG` is `true`, `http-keong` will:
1. Include the `meta` object in all JSON responses.
2. Generate a base64 `checksum` for the data payload.
3. Include an ISO `timestamp` in the response.
4. Print the route table to the console on startup.

### 🧩 Context-Aware Requests
`http-keong` automatically augments the Express `Request` object with a `ctx` property, which includes a `requestId` by default. You can extend this context for your own needs.

```typescript
@Get('/me')
getMe(req: Request) {
  const requestId = req.ctx.requestId;
  return ApiResponse.success({ id: 1, reqId: requestId });
}
```

### 🏥 Built-in Health Check
A dedicated health check endpoint is available by default at `/health`. You can customize the path and handler if needed.

```typescript
KeongFactory.create(controllers, {
  healthCheckHandler: {
    path: '/ping',
    handler: (req, res) => res.send('pong')
  }
});
```

### 🪵 Custom Logger Injection
Integrates seamlessly with `@mqnoy/lolog` or any logger implementing the `ILogger` interface.
```typescript
KeongFactory.create(controllers, { logger: myLogger });
```

### 🔑 Configurable Business Codes
Decouple HTTP status codes from your internal logic codes.
```typescript
KeongFactory.create(controllers, {
  responseCodes: {
    success: 'PROCESS_OK',
    error: 'API_FAILURE'
  }
});
```

---

## 📂 Deep Dive & Examples

Explore our [examples](./examples) directory for practical implementations:
- [**Minimal**](./examples/minimal.ts): Get up and running in 60 seconds.
- [**Real-World**](./examples/real-world.ts): Comprehensive Auth, DTO, Middleware, and Swagger showcase.
- [**Dependency Injection (tsyringe)**](./examples/with-tsyringe.ts): Decouple your logic using professional DI containers.
- [**Custom Config**](./examples/custom-config.ts): Deep dive into meta extractors and business codes.

---

## 🤝 Honesty Section (Trade-offs)

- **Express Dependent**: It's a wrapper, so you're still within the Express ecosystem.
- **Experimental Decorators**: Relies on `experimentalDecorators: true` in TypeScript.
- **Reflect Metadata**: Requires the `reflect-metadata` polyfill.

---

## 🛠 Development & Testing

```bash
pnpm run build  # Build the project
pnpm test       # Run the test suite (Jest + SWC)
```

Built with care for the production Node.js ecosystem. Issues and contributions are welcome on [GitHub](https://github.com/mqnoy/http-keong).
