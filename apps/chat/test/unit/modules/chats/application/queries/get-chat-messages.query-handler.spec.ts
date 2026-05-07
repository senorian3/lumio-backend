import {
  BadRequestDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import {
  GetChatMessagesQueryHandler,
  GetChatMessagesQuery,
} from '@chat/modules/chats/application/queries/get-chat-messages.query-handler';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { ChatQueryRepository } from '@chat/modules/chats/domain/infrastructure/chat-query.repository';

describe('GetChatMessagesQueryHandler', () => {
  let handler: GetChatMessagesQueryHandler;
  let chatRepository: jest.Mocked<ChatRepository>;
  let chatQueryRepository: jest.Mocked<ChatQueryRepository>;

  beforeEach(() => {
    chatRepository = {
      findPrivateChatByUsers: jest.fn(),
      isUserInChat: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    chatQueryRepository = {
      getChatMessages: jest.fn(),
    } as unknown as jest.Mocked<ChatQueryRepository>;

    handler = new GetChatMessagesQueryHandler(
      chatRepository,
      chatQueryRepository,
    );
  });

  it('throws when the actor queries themself', async () => {
    await expect(
      handler.execute(new GetChatMessagesQuery(77, 77, undefined, 20)),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('returns empty result when no chat exists between users', async () => {
    chatRepository.findPrivateChatByUsers.mockResolvedValue(null);

    const result = await handler.execute(
      new GetChatMessagesQuery(77, 12, undefined, 20),
    );

    expect(result).toEqual({
      items: [],
      nextCursor: null,
      totalCount: 0,
      limit: 20,
      currentCursor: null,
    });
    expect(chatRepository.isUserInChat).not.toHaveBeenCalled();
    expect(chatQueryRepository.getChatMessages).not.toHaveBeenCalled();
  });

  it('throws when the actor is not a participant of the chat', async () => {
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.isUserInChat.mockResolvedValue(false);

    await expect(
      handler.execute(new GetChatMessagesQuery(77, 12, undefined, 20)),
    ).rejects.toThrow(NotFoundDomainException);
  });

  it('returns paginated messages when the actor is a participant', async () => {
    const mockMessages = {
      items: [
        {
          id: 'message-1',
          chatId: 15,
          senderId: 12,
          content: 'hello',
          type: 'TEXT',
          status: 'SENT',
          readAt: null,
          createdAt: new Date('2026-04-22T10:00:00.000Z'),
          attachments: [],
        },
      ],
      nextCursor: null,
      totalCount: 5,
      limit: 20,
      currentCursor: null,
    };

    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.isUserInChat.mockResolvedValue(true);
    chatQueryRepository.getChatMessages.mockResolvedValue(mockMessages as any);

    const result = await handler.execute(
      new GetChatMessagesQuery(77, 12, undefined, 20),
    );

    expect(chatRepository.findPrivateChatByUsers).toHaveBeenCalledWith(77, 12);
    expect(chatRepository.isUserInChat).toHaveBeenCalledWith(15, 77);
    expect(chatQueryRepository.getChatMessages).toHaveBeenCalledWith(
      15,
      20,
      undefined,
    );
    expect(result).toEqual(mockMessages);
  });

  it('passes cursor pagination parameters correctly', async () => {
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.isUserInChat.mockResolvedValue(true);
    chatQueryRepository.getChatMessages.mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
      limit: 10,
      currentCursor: 'cursor-1',
    });

    await handler.execute(new GetChatMessagesQuery(77, 12, 'cursor-1', 10));

    expect(chatQueryRepository.getChatMessages).toHaveBeenCalledWith(
      15,
      10,
      'cursor-1',
    );
  });
});
