import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { ChatQueryRepository } from '@chat/modules/chats/domain/infrastructure/chat-query.repository';

export class GetChatMessagesQuery {
  constructor(
    public readonly userId: number,
    public readonly recipientId: number,
    public readonly cursorId?: string,
    public readonly limit: number = 20,
  ) {}
}

@QueryHandler(GetChatMessagesQuery)
export class GetChatMessagesQueryHandler implements IQueryHandler<GetChatMessagesQuery> {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly chatQueryRepository: ChatQueryRepository,
  ) {}

  async execute(query: GetChatMessagesQuery) {
    const { userId, recipientId, cursorId, limit } = query;

    if (userId === recipientId) {
      throw BadRequestDomainException.create(
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
        items: [],
        nextCursor: null,
        totalCount: 0,
        limit,
        currentCursor: cursorId ?? null,
      };
    }

    const isParticipant = await this.chatRepository.isUserInChat(
      chat.id,
      userId,
    );
    if (!isParticipant) {
      throw NotFoundDomainException.create('Chat not found', 'recipientId');
    }

    return this.chatQueryRepository.getChatMessages(chat.id, limit, cursorId);
  }
}
