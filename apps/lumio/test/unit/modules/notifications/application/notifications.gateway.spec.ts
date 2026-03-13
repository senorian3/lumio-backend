import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ExternalQuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.external-query.repository';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { Server, Socket } from 'socket.io';
import { NotificationHistoryParams } from '@lumio/modules/notifications/api/dto/input/notification-pagination-params.input.dto';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let mockNotificationsService: jest.Mocked<NotificationsService>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockSessionRepository: jest.Mocked<ExternalQuerySessionsRepository>;

  const createMockSocket = (
    token?: string,
    userId?: number,
  ): jest.Mocked<Socket> => {
    const socket = {
      id: 'socket-123',
      data: { userId },
      handshake: {
        query: { token },
      },
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
    return socket;
  };

  const createMockServer = (): jest.Mocked<Server> => {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;
  };

  const createNotificationHistoryParams = (
    pageNumber?: number,
    pageSize?: number,
    sortDirection?: SortDirection,
  ): NotificationHistoryParams => {
    const params = new NotificationHistoryParams();
    if (pageNumber !== undefined) params.pageNumber = pageNumber;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortDirection !== undefined) params.sortDirection = sortDirection;
    return params;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: NotificationsService,
          useValue: {
            getUnreadNotificationsCount: jest.fn(),
            getHistory: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ExternalQuerySessionsRepository,
          useValue: {
            getSessionByUserAndDeviceId: jest.fn(),
          },
        },
        {
          provide: UserAccountsConfig,
          useValue: {
            accessTokenSecret: 'test-secret',
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    mockNotificationsService = module.get(NotificationsService);
    mockLogger = module.get(AppLoggerService);
    mockJwtService = module.get(JwtService);
    mockSessionRepository = module.get(ExternalQuerySessionsRepository);

    // Initialize the server mock
    gateway.server = createMockServer();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should connect successfully with valid token', async () => {
      // Arrange
      const mockSocket = createMockSocket('valid-token');
      const userId = 1;
      const deviceId = 'device-123';

      mockJwtService.verify.mockReturnValue({
        userId,
        deviceId,
        tokenVersion: 1,
      });
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue({
        id: 'session-123',
        tokenVersion: 1,
      } as any);
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(5);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
      expect(mockSocket.join).toHaveBeenCalledWith(`user_${userId}`);
      expect(mockSocket.data.userId).toBe(userId);
      expect(mockSocket.emit).toHaveBeenCalledWith('notification:count', {
        count: 5,
      });
    });

    it('should disconnect when token is missing', async () => {
      // Arrange
      const mockSocket = createMockSocket(undefined);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Missing token',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect when token is invalid', async () => {
      // Arrange
      const mockSocket = createMockSocket('invalid-token');
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
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should disconnect when token payload is missing userId', async () => {
      // Arrange
      const mockSocket = createMockSocket('valid-token');
      mockJwtService.verify.mockReturnValue({
        deviceId: 'device-123',
      });

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: Invalid token payload',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect when session does not exist', async () => {
      // Arrange
      const mockSocket = createMockSocket('valid-token');
      mockJwtService.verify.mockReturnValue({
        userId: 1,
        deviceId: 'device-123',
        tokenVersion: 1,
      });
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue(null);

      // Act
      await gateway.handleConnection(mockSocket);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized: No active session',
      });
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect when token version is outdated', async () => {
      // Arrange
      const mockSocket = createMockSocket('valid-token');
      mockJwtService.verify.mockReturnValue({
        userId: 1,
        deviceId: 'device-123',
        tokenVersion: 1,
      });
      mockSessionRepository.getSessionByUserAndDeviceId.mockResolvedValue({
        id: 'session-123',
        tokenVersion: 2,
      } as any);

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
    it('should remove socket from userSockets on disconnect', () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };

      // Simulate connection first
      (gateway as any).userSockets.set(1, new Set(['socket-123']));

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect((gateway as any).userSockets.has(1)).toBe(false);
    });

    it('should handle disconnect when userId is not set', () => {
      // Arrange
      const mockSocket = createMockSocket('token');
      mockSocket.data = {};

      // Act & Assert - should not throw
      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('should not remove other users sockets', () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };

      // Simulate multiple users connected
      (gateway as any).userSockets.set(1, new Set(['socket-123']));
      (gateway as any).userSockets.set(2, new Set(['socket-456']));

      // Act
      gateway.handleDisconnect(mockSocket);

      // Assert
      expect((gateway as any).userSockets.has(2)).toBe(true);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to user room', async () => {
      // Arrange
      const userId = 1;
      const title = 'Test Title';
      const message = 'Test Message';
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(3);

      // Act
      await gateway.sendNotification(userId, title, message);

      // Assert
      expect(gateway.server.to).toHaveBeenCalledWith(`user_${userId}`);
      expect(gateway.server.emit).toHaveBeenCalledWith('notification:new', {
        title,
        message,
      });
      expect(gateway.server.emit).toHaveBeenCalledWith('notification:count', {
        count: 3,
      });
    });

    it('should emit updated unread count after notification', async () => {
      // Arrange
      const userId = 1;
      mockNotificationsService.getUnreadNotificationsCount.mockResolvedValue(
        10,
      );

      // Act
      await gateway.sendNotification(userId, 'Title', 'Message');

      // Assert
      expect(
        mockNotificationsService.getUnreadNotificationsCount,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('handleHistory', () => {
    it('should return history and mark all as read', async () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };
      const mockHistory = {
        items: [
          { id: '1', title: 'Test', message: 'Test', createdAt: new Date() },
        ],
        total: 1,
        pageNumber: 1,
        pageSize: 10,
        pagesCount: 1,
      };
      const payload = createNotificationHistoryParams(
        1,
        10,
        SortDirection.Desc,
      );

      mockNotificationsService.getHistory.mockResolvedValue(mockHistory);
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      // Act
      await gateway.handleHistory(mockSocket, payload);

      // Assert
      expect(mockNotificationsService.getHistory).toHaveBeenCalledWith(
        1,
        1,
        10,
        'desc',
      );
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(1);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'notification:history:response',
        mockHistory,
      );
    });

    it('should emit error when userId is not set', async () => {
      // Arrange
      const mockSocket = createMockSocket('token');
      mockSocket.data = {};
      const payload = createNotificationHistoryParams(
        1,
        10,
        SortDirection.Desc,
      );

      // Act
      await gateway.handleHistory(mockSocket, payload);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Unauthorized',
      });
      expect(mockNotificationsService.getHistory).not.toHaveBeenCalled();
    });

    it('should reset unread count to 0 after getting history', async () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };
      const mockHistory = {
        items: [],
        total: 0,
        pageNumber: 1,
        pageSize: 10,
        pagesCount: 0,
      };
      const payload = createNotificationHistoryParams(
        1,
        10,
        SortDirection.Desc,
      );

      mockNotificationsService.getHistory.mockResolvedValue(mockHistory);
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      // Act
      await gateway.handleHistory(mockSocket, payload);

      // Assert
      expect(gateway.server.emit).toHaveBeenCalledWith('notification:count', {
        count: 0,
      });
    });

    it('should handle and log errors', async () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };
      const payload = createNotificationHistoryParams(
        1,
        10,
        SortDirection.Desc,
      );
      const error = new Error('Database error');

      mockNotificationsService.getHistory.mockRejectedValue(error);

      // Act
      await gateway.handleHistory(mockSocket, payload);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in notifications gateway'),
        expect.any(String),
        'NotificationsGateway',
      );
    });

    it('should use default pagination when payload is undefined', async () => {
      // Arrange
      const mockSocket = createMockSocket('token', 1);
      mockSocket.data = { userId: 1 };
      const mockHistory = {
        items: [],
        total: 0,
        pageNumber: 1,
        pageSize: 10,
        pagesCount: 0,
      };

      mockNotificationsService.getHistory.mockResolvedValue(mockHistory);
      mockNotificationsService.markAllAsRead.mockResolvedValue(undefined);

      // Act
      await gateway.handleHistory(mockSocket, {} as any);

      // Assert
      expect(mockNotificationsService.getHistory).toHaveBeenCalledWith(
        1,
        undefined,
        undefined,
        undefined,
      );
    });
  });
});
