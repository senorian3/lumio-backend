import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { EventBus } from '@nestjs/cqrs';
import {
  SendMessageCommand,
  SendMessageCommandHandler,
} from '@chat/modules/chats/application/commands/send-message.command-handler';
import { MessageCreatedEvent } from '@chat/modules/chats/application/events/message-created.event';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';

describe('SendMessageCommandHandler', () => {
  let handler: SendMessageCommandHandler;
  let chatRepository: jest.Mocked<ChatRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    chatRepository = {
      findPrivateChatByUsers: jest.fn(),
      createPrivateChat: jest.fn(),
      createMessage: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new SendMessageCommandHandler(chatRepository, eventBus);
  });

  it('throws when the actor tries to send a message to themself', async () => {
    await expect(
      handler.execute(new SendMessageCommand(77, 77, 'hello')),
    ).rejects.toThrow(BadRequestDomainException);
  });

  it('creates a private chat when none exists and publishes a created event', async () => {
    chatRepository.findPrivateChatByUsers.mockResolvedValue(null);
    chatRepository.createPrivateChat.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessage.mockResolvedValue({
      id: 'message-1',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
    } as any);

    await handler.execute(new SendMessageCommand(77, 12, 'hello'));

    expect(chatRepository.findPrivateChatByUsers).toHaveBeenCalledWith(77, 12);
    expect(chatRepository.createPrivateChat).toHaveBeenCalledWith(77, 12);
    expect(chatRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat: { connect: { id: 15 } },
        senderId: 77,
        content: 'hello',
        type: 'TEXT',
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(MessageCreatedEvent),
    );
  });

  it('reuses an existing private chat when one already exists', async () => {
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessage.mockResolvedValue({
      id: 'message-1',
      createdAt: new Date('2026-04-22T10:00:00.000Z'),
    } as any);

    await handler.execute(new SendMessageCommand(77, 12, 'hello'));

    expect(chatRepository.createPrivateChat).not.toHaveBeenCalled();
    expect(chatRepository.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chat: { connect: { id: 15 } },
      }),
    );
  });

  it('publishes a MessageCreatedEvent with correct payload', async () => {
    const createdAt = new Date('2026-04-22T10:00:00.000Z');
    chatRepository.findPrivateChatByUsers.mockResolvedValue({ id: 15 } as any);
    chatRepository.createMessage.mockResolvedValue({
      id: 'message-1',
      createdAt,
    } as any);

    await handler.execute(new SendMessageCommand(77, 12, 'hello'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      new MessageCreatedEvent(15, 'message-1', 77, 12, 'hello', createdAt),
    );
  });
});
