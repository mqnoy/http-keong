import 'reflect-metadata';
import express from 'express';
import { KeongFactory, Controller, Get, ApiResponse } from '../index';

@Controller('/config-test')
class ConfigTestController {
  @Get('/')
  test(req: express.Request) {
    // Manually adding to context
    req.ctx = { ...req.ctx, uniqueValue: 'keong-123' };

    return ApiResponse.success({ ok: true });
  }

  @Get('/error')
  testError() {
    // This will use the configured custom business code for errors
    return ApiResponse.error(undefined, 'Something failed');
  }
}

const app = KeongFactory.create([ConfigTestController], {
  // 1. Customizing business codes
  responseCodes: {
    success: 'SUCCESS_BUSINESS_OK',
    error: 'BUSINESS_LOGIC_ERROR',
  },

  // 2. Customizing metadata extraction
  metaExtractor: (req) => {
    return {
      appName: 'ConfigDemo',
      // We can access properties added by middleware or controllers
      ...req.ctx,
      timestamp: Date.now(),
    };
  },

  customConfiguration: (app) => app.use(express.json()),
});

const server = app.listen(3001, () => {
  console.log('Advanced config example running at http://localhost:3001');
});

server.on('error', (err: any) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
