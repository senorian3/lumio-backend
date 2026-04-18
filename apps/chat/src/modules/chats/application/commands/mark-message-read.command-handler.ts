import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

export class MarkMessageReadCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MarkMessageReadCommand)
export class MarkMessageReadCommandHandler implements ICommandHandler<MarkMessageReadCommand> {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(command: MarkMessageReadCommand) {
    const { messageId, userId } = command;

    const result = await this.chatRepository.markMessageAsRead(
      messageId,
      userId,
    );

    if (result.count === 0) {
      throw NotFoundDomainException.create('Message not found or already read');
    }

    return {
      success: true,
      message: 'Message marked as read',
    };
  }
}
