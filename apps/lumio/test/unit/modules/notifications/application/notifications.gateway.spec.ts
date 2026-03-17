import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockSessionRepository: jest.Mocked<ExternalQuerySessionsRepository>;
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

    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
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
      // Arrange
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

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockValidToken, {
        secret: mockUserAccountsConfig.accessTokenSecret,
      });
      expect(
        mockSessionRepository.getSessionByUserAndDeviceId,
      ).toHaveBeenCalledWith(mockUserId, mockDeviceId);
      expect(mockSocket.join).toHaveBeenCalledWith(`user_${mockUserId}`);
      expect(mockSocket.data.userId).toBe(mockUserId);
    });

    it('should accept connection with valid token in authorization header', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: {},
          headers: { authorization: `Bearer ${mockValidToken}` },
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue(mockValidPayload);
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue(
        mockSession,
      );

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockValidToken, {
        secret: mockUserAccountsConfig.accessTokenSecret,
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`user_${mockUserId}`);
    });

    it('should reject connection without token', async () => {
      // Arrange
      const mockSocket = createMockSocket();

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Missing token',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should reject connection with invalid token', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: 'invalid-token' },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Invalid token',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should reject connection with invalid token payload (missing userId)', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: mockValidToken },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue({ deviceId: mockDeviceId });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Invalid token payload',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should reject connection with invalid token payload (missing deviceId)', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: mockValidToken },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue({ userId: mockUserId });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Invalid token payload',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should reject connection when session not found', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: mockValidToken },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue(mockValidPayload);
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue(null);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: No active session',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should reject connection when token version is outdated', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: mockValidToken },
          headers: {},
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue({
        ...mockValidPayload,
        tokenVersion: 1,
      });
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue({
        ...mockSession,
        tokenVersion: 2, // Session has newer token version
      });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Token invalidated',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should add socket to userSockets map', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        id: 'socket-456',
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

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      const sockets = gateway['userSockets'].get(mockUserId);
      expect(sockets).toBeDefined();
      expect(sockets?.has('socket-456')).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from userSockets map', () => {
      // Arrange
      const userId = 1;
      const socketId = 'socket-123';
      const mockSocket = createMockSocket({
        id: socketId,
        data: { userId },
      });

      gateway['userSockets'] = new Map([
        [userId, new Set([socketId, 'socket-456'])],
      ]);

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      const sockets = gateway['userSockets'].get(userId);
      expect(sockets).toBeDefined();
      expect(sockets?.has(socketId)).toBe(false);
      expect(sockets?.has('socket-456')).toBe(true);
    });

    it('should remove user from map when last socket disconnects', () => {
      // Arrange
      const userId = 1;
      const socketId = 'socket-123';
      const mockSocket = createMockSocket({
        id: socketId,
        data: { userId },
      });

      gateway['userSockets'] = new Map([[userId, new Set([socketId])]]);

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect(gateway['userSockets'].has(userId)).toBe(false);
    });

    it('should handle disconnect when userId is not set', () => {
      // Arrange
      const mockSocket = createMockSocket({
        data: {},
      });

      // Act & Assert - should not throw
      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should handle disconnect when user not in map', () => {
      // Arrange
      const mockSocket = createMockSocket({
        data: { userId: 999 },
      });

      gateway['userSockets'] = new Map();

      // Act & Assert - should not throw
      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user room', async () => {
      // Arrange
      const userId = 1;
      const title = 'Test Title';
      const message = 'Test Message';

      // Act
      await gateway.sendNotification(userId, title, message);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification:new', {
        title,
        message,
      });
    });

    it('should send notification with special characters', async () => {
      // Arrange
      const userId = 42;
      const title = 'Подписка активирована';
      const message = 'Ваша подписка активирована и действует до 31.12.2025';

      // Act
      await gateway.sendNotification(userId, title, message);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification:new', {
        title,
        message,
      });
    });
  });
});
