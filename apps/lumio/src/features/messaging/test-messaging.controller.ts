import { Controller, Get } from '@nestjs/common';
import { UserEventsPublisher } from './user-events.publisher';

@Controller('test-messaging')
export class TestMessagingController {
  constructor(private readonly userEventsPublisher: UserEventsPublisher) {}

  @Get('user-created')
  async testUserCreated() {
    const userId = Math.floor(Math.random() * 1000) + 1;
    const username = `testuser${userId}`;
    const email = `test${userId}@example.com`;
    const createdAt = new Date();

    await this.userEventsPublisher.publishUserCreated(
      userId,
      username,
      email,
      createdAt,
    );

    return {
      message: 'User created event published',
      event: {
        userId,
        username,
        email,
        createdAt,
      },
    };
  }

  @Get('user-updated')
  async testUserUpdated() {
    const userId = Math.floor(Math.random() * 1000) + 1;
    const username = `updateduser${userId}`;
    const email = `updated${userId}@example.com`;
    const updatedAt = new Date();

    await this.userEventsPublisher.publishUserUpdated(
      userId,
      username,
      email,
      updatedAt,
    );

    return {
      message: 'User updated event published',
      event: {
        userId,
        username,
        email,
        updatedAt,
      },
    };
  }

  @Get('user-deleted')
  async testUserDeleted() {
    const userId = Math.floor(Math.random() * 1000) + 1;
    const deletedAt = new Date();

    await this.userEventsPublisher.publishUserDeleted(userId, deletedAt);

    return {
      message: 'User deleted event published',
      event: {
        userId,
        deletedAt,
      },
    };
  }
}
