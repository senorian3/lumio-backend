import { IEvent } from '@nestjs/cqrs';

export class MessageCreatedEvent implements IEvent {
  constructor(
    public readonly chatId: number,
    public readonly messageId: string,
    public readonly senderId: number,
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}
