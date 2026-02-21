import 'reflect-metadata';
import express from 'express';
import { KeongFactory, Controller, Get, ApiResponse } from '../index';

@Controller('/hello')
class HelloController {
  @Get('/')
  index() {
    return ApiResponse.success({ message: 'Hello World' });
  }

  @Get('/ping')
  ping() {
    return 'pong'; // You can also return plain strings
  }
}

const app = KeongFactory.create([HelloController], {
  customConfiguration: (app) => app.use(express.json()),
});

const server = app.listen(3000, () => {
  console.log('Minimal server running at http://localhost:3000');
});

server.on('error', (err: any) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
