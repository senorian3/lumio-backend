import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { MessageReadEvent } from '../events/message-read.event';

export class MarkMessageReadCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MarkMessageReadCommand)
export class MarkMessageReadCommandHandler implements ICommandHandler<MarkMessageReadCommand> {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarkMessageReadCommand) {
    const { messageId, userId } = command;

    const result = await this.chatRepository.markMessageAsRead(
      messageId,
      userId,
    );

    if (!result) {
      throw NotFoundDomainException.create(
        'Message not found or already read',
        'messageId',
      );
    }

    this.eventBus.publish(
      new MessageReadEvent(
        result.id,
        result.chatId,
        userId,
        result.senderId,
        result.readAt,
      ),
    );

    return {
      success: true,
      message: 'Message marked as read',
    };
  }
}
