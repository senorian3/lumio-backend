import { Injectable } from '@nestjs/common';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from 'libs/messaging/dto/user-events.dto';
import { MessagingService } from 'libs/messaging/messaging.service';

@Injectable()
export class UserEventsPublisher {
  constructor(private messagingService: MessagingService) {}

  async publishUserCreated(
    userId: number,
    username: string,
    email: string,
    createdAt: Date,
  ): Promise<void> {
    const event = new UserCreatedEvent(userId, username, email, createdAt);
    await this.messagingService.publishUserCreated(event);
    console.log('Published user created event:', event);
  }

  async publishUserUpdated(
    userId: number,
    username: string,
    email: string,
    updatedAt: Date,
  ): Promise<void> {
    const event = new UserUpdatedEvent(userId, username, email, updatedAt);
    await this.messagingService.publishUserUpdated(event);
    console.log('Published user updated event:', event);
  }

  async publishUserDeleted(userId: number, deletedAt: Date): Promise<void> {
    const event = new UserDeletedEvent(userId, deletedAt);
    await this.messagingService.publishUserDeleted(event);
    console.log('Published user deleted event:', event);
  }
}
