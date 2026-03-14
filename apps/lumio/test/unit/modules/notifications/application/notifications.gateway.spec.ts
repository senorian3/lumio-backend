import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockSessionRepository: jest.Mocked<ExternalQuerySessionsRepository>;
  let mockNotificationsService: jest.Mocked<NotificationsService>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockUserAccountsConfig: jest.Mocked<UserAccountsConfig>;
  let mockServer: jest.Mocked<Server>;

  const mockValidToken = 'valid.jwt.token';
  const mockUserId = 1;
  const mockDeviceId = 'device-123';
  const mockTokenVersion = 1;

  const mockValidPayload = {
    userId: mockUserId,
    deviceId: mockDeviceId,
    tokenVersion: mockTokenVersion,
  };

  const mockSession = {
    id: 1,
    userId: mockUserId,
    deviceId: mockDeviceId,
    tokenVersion: mockTokenVersion,
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deviceName: 'Test Device',
    ip: '127.0.0.1',
  };

  const createMockSocket = (overrides = {}) => {
    const socket = {
      id: 'socket-123',
      handshake: {
        auth: {},
        headers: {},
        query: {},
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      ...overrides,
    };
    return socket as unknown as jest.Mocked<Socket>;
  };

  beforeEach(async () => {
    mockJwtService = {
      verify: jest.fn(),
    } as any;

    mockSessionRepository = {
      getSessionByUserAndDeviceId: jest.fn(),
    } as any;

    mockNotificationsService = {
      getUnreadNotificationsCount: jest.fn(),
      getHistory: jest.fn(),
      markAllAsRead: jest.fn(),
      sendSubscriptionActiveNotification: jest.fn(),
    } as any;

    mockLogger = {
      error: jest.fn(),
    } as any;

    mockUserAccountsConfig = {
      accessTokenSecret: 'test-secret',
    } as any;

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ExternalQuerySessionsRepository,
          useValue: mockSessionRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
        {
          provide: UserAccountsConfig,
          useValue: mockUserAccountsConfig,
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    gateway.server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid token in auth object', async () => {
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: mockValidToken },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue(mockValidPayload);
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue(
        mockSession,
      );
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(5);

      await gateway.handleConnection(mockSocket);

      expect(mockJwtService.verify).toHaveBeenCalledWith(mockValidToken, {
        secret: mockUserAccountsConfig.accessTokenSecret,
      });
      expect(
        mockSessionRepository.getSessionByUserAndDeviceId,
      ).toHaveBeenCalledWith(mockUserId, mockDeviceId);
      expect(mockSocket.join).toHaveBeenCalledWith(`user_${mockUserId}`);
      expect(mockSocket.data.userId).toBe(mockUserId);
      expect(mockSocket.emit).toHaveBeenCalledWith('notification:count', {
        count: 5,
      });
    });

    it('should reject connection without token', async () => {
      const mockSocket = createMockSocket();

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Missing token',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from userSockets map', () => {
      const userId = 1;
      const socketId = 'socket-123';
      const mockSocket = createMockSocket({
        id: socketId,
        data: { userId },
      });

      gateway['userSockets'] = new Map([
        [userId, new Set([socketId, 'socket-456'])],
      ]);

      gateway.handleDisconnect(mockSocket);

      const sockets = gateway['userSockets'].get(userId);
      expect(sockets).toBeDefined();
      expect(sockets?.has(socketId)).toBe(false);
      expect(sockets?.has('socket-456')).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user room', async () => {
      const userId = 1;
      const title = 'Test Title';
      const message = 'Test Message';
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(1);

      await gateway.sendNotification(userId, title, message);

      expect(mockServer.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification:new', {
        title,
        message,
      });
      expect(mockServer.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification:count', {
        count: 1,
      });
      expect(
        mockNotificationsService.getUnreadNotificationsCount,
      ).toHaveBeenCalledWith(userId);
    });
  });
});
