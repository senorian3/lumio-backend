import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

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
  constructor(private readonly chatRepository: ChatRepository) {}

  async execute(query: GetChatMessagesQuery) {
    const { userId, recipientId, page, limit } = query;

    if (userId === recipientId) {
      throw NotFoundDomainException.create(
        'You cannot chat with yourself',
        'recipientId',
      );
    }

    const chat = await this.chatRepository.findPrivateChatByUsers(
      userId,
      recipientId,
    );

    if (!chat) {
      return {
        total: 0,
        page,
        limit,
        totalPages: 0,
        items: [],
      };
    }

    const isParticipant = await this.chatRepository.isUserInChat(
      chat.id,
      userId,
    );
    if (!isParticipant) {
      throw NotFoundDomainException.create('Chat not found');
    }

    return this.chatRepository.getChatMessages(chat.id, page, limit);
  }
}
