import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { EventBus } from '@nestjs/cqrs';
import { Server, Socket } from 'socket.io';
import { ChatsGateway } from '@chat/modules/chats/api/chats.gateway';
import { ChatRepository } from '@chat/modules/chats/domain/infrastructure/chat.repository';
import { LumioAuthHttpAdapter } from '@chat/core/adapters/lumio-auth-http.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('ChatsGateway', () => {
  let gateway: ChatsGateway;
  let chatRepository: jest.Mocked<ChatRepository>;
  let lumioAuthHttpAdapter: jest.Mocked<LumioAuthHttpAdapter>;
  let server: jest.Mocked<Server>;
  let logger: jest.Mocked<AppLoggerService>;

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
          useValue: {
            subscribe: jest.fn(),
          },
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

  it('rejects room join when actor is not a participant of the chat', async () => {
    const client = createSocket({
      data: { userId: 7 },
    });
    chatRepository.isUserInChat.mockResolvedValue(false);

    await expect(
      gateway.handleJoinChat(client, { chatId: 15 }),
    ).rejects.toThrow(WsException);

    expect(chatRepository.isUserInChat).toHaveBeenCalledWith(15, 7);
    expect(client.join).not.toHaveBeenCalledWith('chat:15');
  });

  it('rejects typing events when actor is not a participant of the chat', async () => {
    const client = createSocket({
      data: { userId: 7 },
    });
    chatRepository.isUserInChat.mockResolvedValue(false);

    await expect(
      gateway.handleTypingStart(client, { chatId: 15 }),
    ).rejects.toThrow(WsException);
  });
});
