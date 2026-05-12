import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { EventBus } from '@nestjs/cqrs';
import {
  MarkMessageReadCommand,
  MarkMessageReadCommandHandler,
} from '@chat/modules/chats/application/commands/mark-message-read.command-handler';
import { MessageReadEvent } from '@chat/modules/chats/application/events/message-read.event';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

describe('MarkMessageReadCommandHandler', () => {
  let handler: MarkMessageReadCommandHandler;
  let chatRepository: jest.Mocked<ChatRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    chatRepository = {
      markMessageAsRead: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new MarkMessageReadCommandHandler(chatRepository, eventBus);
  });

  it('publishes a scoped read event after a successful read', async () => {
    const readAt = new Date('2026-04-22T10:00:00.000Z');
    chatRepository.markMessageAsRead.mockResolvedValue({
      id: 'message-1',
      chatId: 15,
      senderId: 12,
      readAt,
    } as any);

    await handler.execute(new MarkMessageReadCommand('message-1', 77));

    expect(eventBus.publish).toHaveBeenCalledWith(
      new MessageReadEvent('message-1', 15, 77, 12, readAt),
    );
  });

  it('throws when the message cannot be marked as read', async () => {
    chatRepository.markMessageAsRead.mockResolvedValue(null);

    await expect(
      handler.execute(new MarkMessageReadCommand('message-1', 77)),
    ).rejects.toThrow(NotFoundDomainException);
  });
});
