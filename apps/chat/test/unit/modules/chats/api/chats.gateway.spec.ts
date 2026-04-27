import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { EventBus } from '@nestjs/cqrs';
import { Server, Socket } from 'socket.io';
import { ChatsGateway } from '@chat/modules/chats/application/chats.gateway';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { LumioAuthHttpAdapter } from '@chat/core/adapters/lumio-auth-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { MessageCreatedEvent } from '@chat/modules/chats/application/events/message-created.event';
import { MediaMessageCreatedEvent } from '@chat/modules/chats/application/events/media-message-created.event';
import { MessageReadEvent } from '@chat/modules/chats/application/events/message-read.event';
import { MessageType } from '@chat/modules/chats/domain/message-types.enum';

describe('ChatsGateway', () => {
  let gateway: ChatsGateway;
  let chatRepository: jest.Mocked<ChatRepository>;
  let lumioAuthHttpAdapter: jest.Mocked<LumioAuthHttpAdapter>;
  let server: jest.Mocked<Server>;
  let logger: jest.Mocked<AppLoggerService>;
  let eventBus: jest.Mocked<EventBus>;

  const createSocket = (overrides: Partial<Socket> = {}) =>
    ({
      id: 'socket-1',
      handshake: {
        auth: { token: 'valid-token' },
        query: {},
      },
      data: {},
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      ...overrides,
    }) as unknown as jest.Mocked<Socket>;

  beforeEach(async () => {
    chatRepository = {
      isUserInChat: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;

    lumioAuthHttpAdapter = {
      validateAccessToken: jest.fn(),
    } as unknown as jest.Mocked<LumioAuthHttpAdapter>;

    server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;
    logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLoggerService>;

    eventBus = {
      subscribe: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsGateway,
        {
          provide: ChatRepository,
          useValue: chatRepository,
        },
        {
          provide: LumioAuthHttpAdapter,
          useValue: lumioAuthHttpAdapter,
        },
        {
          provide: EventBus,
          useValue: eventBus,
        },
        {
          provide: AppLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    gateway = module.get(ChatsGateway);
    gateway.server = server;
  });

  it('authenticates a socket through Lumio and stores actor context on connect', async () => {
    const client = createSocket();
    lumioAuthHttpAdapter.validateAccessToken.mockResolvedValue({
      userId: 42,
    });

    await gateway.handleConnection(client);

    expect(lumioAuthHttpAdapter.validateAccessToken).toHaveBeenCalledWith(
      'valid-token',
    );
    expect(client.data.userId).toBe(42);
    expect(client.join).toHaveBeenCalledWith('user:42');
    expect(client.emit).toHaveBeenCalledWith('connection:established', {
      userId: 42,
    });
  });

  it('disconnects a socket when no token is provided on connect', async () => {
    const client = createSocket({
      handshake: {
        auth: {},
        query: {},
        headers: {},
        time: new Date().toISOString(),
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: 0,
        url: '/socket.io/?EIO=4&transport=websocket',
      },
    });

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
  });

  it('disconnects a socket when token validation fails on connect', async () => {
    const client = createSocket();
    lumioAuthHttpAdapter.validateAccessToken.mockRejectedValue(
      new Error('Invalid token'),
    );

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('removes socket from userSockets map on disconnect', async () => {
    const client = createSocket({
      data: { userId: 42 },
    });

    await gateway.handleConnection(client);
    gateway.handleDisconnect(client);

    expect(gateway.isUserOnline(42)).toBe(false);
    expect(logger.log).toHaveBeenCalledWith('User 42 disconnected');
  });

  it('rejects typing:stop events when actor is not a participant of the chat', async () => {
    const client = createSocket({
      data: { userId: 7 },
    });
    chatRepository.isUserInChat.mockResolvedValue(false);

    await expect(
      gateway.handleTypingStop(client, { chatId: 15 }),
    ).rejects.toThrow(WsException);
  });

  it('broadcasts message:created, message:sent, and message:received on MessageCreatedEvent', () => {
    const event = new MessageCreatedEvent(
      15,
      'message-1',
      77,
      12,
      'hello',
      new Date('2026-04-22T10:00:00.000Z'),
    );

    gateway['handleMessageCreated'](event);

    expect(server.to).toHaveBeenCalledWith('chat:15');
    expect(server.to).toHaveBeenCalledWith('user:77');
    expect(server.to).toHaveBeenCalledWith('user:12');
    expect(server.emit).toHaveBeenCalledTimes(3);
  });

  it('broadcasts message:created, message:sent, and message:received on MediaMessageCreatedEvent', () => {
    const event = new MediaMessageCreatedEvent(
      15,
      'message-1',
      77,
      12,
      MessageType.IMAGE,
      'look',
      {
        url: 'https://example.com/file.png',
        key: 'uploads/file.png',
        mimeType: 'image/png',
        size: 1024,
      },
      new Date('2026-04-22T10:00:00.000Z'),
    );

    gateway['handleMediaMessageCreated'](event);

    expect(server.to).toHaveBeenCalledWith('chat:15');
    expect(server.to).toHaveBeenCalledWith('user:77');
    expect(server.to).toHaveBeenCalledWith('user:12');
    expect(server.emit).toHaveBeenCalledTimes(3);
  });

  it('broadcasts message:read to chat and sender on MessageReadEvent', () => {
    const event = new MessageReadEvent(
      'message-1',
      15,
      77,
      12,
      new Date('2026-04-22T10:00:00.000Z'),
    );

    gateway['handleMessageRead'](event);

    expect(server.to).toHaveBeenCalledWith('chat:15');
    expect(server.to).toHaveBeenCalledWith('user:12');
    expect(server.emit).toHaveBeenCalledTimes(2);
  });

  it('subscribes to event bus events on construction', () => {
    expect(eventBus.subscribe).toHaveBeenCalled();
  });
});
