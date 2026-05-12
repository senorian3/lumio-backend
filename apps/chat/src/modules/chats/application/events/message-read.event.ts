import { IEvent } from '@nestjs/cqrs';

export class MessageReadEvent implements IEvent {
  constructor(
    public readonly messageId: string,
    public readonly chatId: number,
    public readonly readerId: number,
    public readonly senderId: number,
    public readonly readAt: Date,
  ) {}
}
