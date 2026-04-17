import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

export class SendMessageCommand {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly message: string,
  ) {}
}

@CommandHandler(SendMessageCommand)
export class SendMessageCommandHandler implements ICommandHandler<SendMessageCommand> {
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(command: SendMessageCommand) {
    const { userId, recipientId, message } = command;

    if (userId === recipientId) {
      throw BadRequestDomainException.create(
        'Cannot send message to yourself',
        'recipientId',
      );
    }

    let chat = await this.chatRepository.findPrivateChatByUsers(
      userId,
      recipientId,
    );

    if (!chat) {
      chat = await this.chatRepository.createPrivateChat(userId, recipientId);
    }

    const createdMessage = await this.chatRepository.createMessage({
      chat: { connect: { id: chat.id } },
      senderId: userId,
      content: message,
      type: 'TEXT',
    });

    return createdMessage;
  }
}
