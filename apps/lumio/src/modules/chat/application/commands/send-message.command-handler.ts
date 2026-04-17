import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatHttpAdapter } from '@lumio/modules/chat/application/chat-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class SendMessageCommand {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly message: string,
  ) {}
}

@CommandHandler(SendMessageCommand)
export class SendMessageCommandHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly chatHttpAdapter: ChatHttpAdapter,
  ) {}

  async execute(command: SendMessageCommand) {
    const recipient = await this.externalQueryUserAccountsRepository.findUserId(
      command.recipientId,
    );
    if (!recipient) {
      throw BadRequestDomainException.create(
        'Recipient not found',
        'recipientId',
      );
    }

    return this.chatHttpAdapter.sendMessage(
      `${GLOBAL_PREFIX}/chats/send-message`,
      command.userId,
      command.recipientId,
      command.message,
    );
  }
}
