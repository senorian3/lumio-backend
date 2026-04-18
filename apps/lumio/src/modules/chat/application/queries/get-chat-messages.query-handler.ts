import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { ChatHttpAdapter } from '@lumio/modules/chat/application/chat-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class GetChatMessagesQuery {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}

@QueryHandler(GetChatMessagesQuery)
export class GetChatMessagesQueryHandler implements IQueryHandler<GetChatMessagesQuery> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly chatHttpAdapter: ChatHttpAdapter,
  ) {}

  async execute(query: GetChatMessagesQuery) {
    const recipient = await this.externalQueryUserAccountsRepository.findUserId(
      query.recipientId,
    );
    if (!recipient) {
      throw BadRequestDomainException.create(
        'Recipient not found',
        'recipientId',
      );
    }

    return this.chatHttpAdapter.getChatMessages(
      `${GLOBAL_PREFIX}/chats/messages`,
      query.userId,
      query.recipientId,
      query.page,
      query.limit,
    );
  }
}
