import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

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
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(5);

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
      expect(mockSocket.emit).toHaveBeenCalledWith('notification:count', {
        count: 5,
      });
    });

    it('should accept connection with valid token in Authorization header', async () => {
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
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(3);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockValidToken, {
        secret: mockUserAccountsConfig.accessTokenSecret,
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`user_${mockUserId}`);
      expect(mockSocket.data.userId).toBe(mockUserId);
      expect(mockSocket.emit).toHaveBeenCalledWith('notification:count', {
        count: 3,
      });
    });

    it('should prioritize auth token over Authorization header', async () => {
      // Arrange
      const authToken = 'auth-token';
      const headerToken = 'header-token';
      const mockSocket = createMockSocket({
        handshake: {
          auth: { token: authToken },
          headers: { authorization: `Bearer ${headerToken}` },
          query: {},
        },
      });

      mockJwtService.verify.mockReturnValue(mockValidPayload);
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue(
        mockSession,
      );
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(0);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(authToken, {
        secret: mockUserAccountsConfig.accessTokenSecret,
      });
      expect(mockJwtService.verify).not.toHaveBeenCalledWith(
        headerToken,
        expect.anything(),
      );
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
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Invalid token',
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
        tokenVersion: 2, // Новее чем в токене
      });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Token invalidated',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
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

    it('should delete user entry when no sockets left', () => {
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

    it('should do nothing if userId not found', () => {
      // Arrange
      const mockSocket = createMockSocket({
        data: { userId: undefined },
      });

      gateway['userSockets'] = new Map();

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect(gateway['userSockets'].size).toBe(0);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user room', async () => {
      // Arrange
      const userId = 1;
      const title = 'Test Title';
      const message = 'Test Message';
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(1);

      // Act
      await gateway.sendNotification(userId, title, message);

      // Assert
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

  describe('handleHistory', () => {
    it('should return notification history for authenticated user', async () => {
      // Arrange
      const userId = 1;
      const mockHistory: NotificationPaginationTransferDto = {
        items: [],
        total: 0,
        pageNumber: 1,
        pageSize: 10,
        pagesCount: 0,
      };

      const mockSocket = createMockSocket({
        data: { userId },
      });

      mockNotificationsService.getHistory.mockResolvedValue(mockHistory);
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      // Act
      await gateway['handleHistory'](mockSocket, {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.Desc,
        sortBy: 'createdAt',
        calculateSkip: () => 0,
      });

      // Assert
      expect(mockNotificationsService.getHistory).toHaveBeenCalledWith(
        userId,
        1,
        10,
        SortDirection.Desc,
      );
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(
        userId,
      );
      expect(mockServer.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('notification:count', {
        count: 0,
      });
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'notification:history:response',
        mockHistory,
      );
    });

    it('should emit error for unauthenticated user', async () => {
      // Arrange
      const mockSocket = createMockSocket({
        data: { userId: undefined },
      });

      // Act
      await gateway['handleHistory'](mockSocket, {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.Desc,
        sortBy: 'createdAt',
        calculateSkip: () => 0,
      });

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized',
      });
      expect(mockNotificationsService.getHistory).not.toHaveBeenCalled();
    });

    it('should log error when history retrieval fails', async () => {
      // Arrange
      const userId = 1;
      const error = new Error('Database error');
      const mockSocket = createMockSocket({
        data: { userId },
      });

      mockNotificationsService.getHistory.mockRejectedValue(error);

      // Act
      await gateway['handleHistory'](mockSocket, {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: SortDirection.Desc,
        sortBy: 'createdAt',
        calculateSkip: () => 0,
      });

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Error in notifications gateway: ${error.message}`,
        error.stack,
        'NotificationsGateway',
      );
    });
  });
});
