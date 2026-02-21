import 'reflect-metadata';
import express from 'express';
// Note: You need to install 'tsyringe' in your project for this example to work.
import { container, injectable, inject } from 'tsyringe';
import { KeongFactory, Controller, Get, ApiResponse, DIContainer } from '../index';

/**
 * 1. Define your Service using tsyringe's @injectable()
 */
@injectable()
class UserService {
  getUsers() {
    return [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Doe' },
    ];
  }
}

/**
 * 2. Define your Controller using both tsyringe and http-keong decorators.
 * tsyringe handles the constructor injection.
 */
@injectable()
@Controller('/users')
class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  @Get('/')
  index() {
    const users = this.userService.getUsers();
    return ApiResponse.success(users);
  }
}

/**
 * 3. Create a wrapper for tsyringe that satisfies http-keong's DIContainer interface.
 * tsyringe's 'container.resolve' signature matches perfectly.
 */
const keongContainer: DIContainer = {
  resolve: <T>(target: any) => container.resolve<T>(target),
};

/**
 * 4. Bootstrap the app and pass the container
 */
const app = KeongFactory.create([UserController], {
  container: keongContainer,
  customConfiguration: (app) => app.use(express.json()),
});

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`Server with tsyringe running at http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
