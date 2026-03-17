import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '@lumio/modules/notifications/api/notifications.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import {
  GetUserNotificationsParams,
  NotificationsSortBy,
} from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import {
  NotificationViewDto,
  UnreadCountViewDto,
} from '@lumio/modules/notifications/api/dto/output/notification.output.dto';
import { MarkNotificationsAsReadInputDto } from '@lumio/modules/notifications/api/dto/input/mark-notifications-as-read.input.dto';
import { GetUserNotificationsQuery } from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';
import { GetUnreadCountQuery } from '@lumio/modules/notifications/application/queries/get-unread-count.query-handler';
import { MarkNotificationsAsReadCommand } from '@lumio/modules/notifications/application/commands/mark-notifications-as-read.command.handler';
import { DeleteNotificationCommand } from '@lumio/modules/notifications/application/commands/delete-notification.command.handler';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockUserId = 1;
  const mockNotificationId = 'notification-123';

  const mockNotificationView: NotificationViewDto = {
    id: mockNotificationId,
    title: 'Test notification',
    message: 'Test message',
    isRead: false,
    createdAt: new Date('2026-03-15T10:30:00Z'),
  };

  const mockPaginatedNotifications: PaginatedViewDto<NotificationViewDto[]> = {
    items: [mockNotificationView],
    totalCount: 1,
    pageSize: 10,
    page: 1,
    pagesCount: 1,
    unreadCount: 1,
  };

  const mockUnreadCount: UnreadCountViewDto = {
    unreadCount: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWebSocketDocs', () => {
    it('should return WebSocket documentation', () => {
      // Act
      const result = controller.getWebSocketDocs();

      // Assert
      expect(result).toEqual({
        message: 'See Swagger description for WebSocket documentation',
        websocket: {
          namespace: '/notifications',
          url: 'wss://lumio.su/notifications',
        },
        events: {
          'notification:new': {
            title: 'Подписка активирована',
            message: 'Ваша подписка активирована и действует до 14.04.2026',
          },
          error: {
            message: 'Unauthorized: Missing token',
          },
        },
      });
    });
  });

  describe('getHistory', () => {
    it('should return paginated notifications', async () => {
      // Arrange
      const queryParams = new GetUserNotificationsParams();
      queryParams.pageNumber = 1;
      queryParams.pageSize = 10;
      queryParams.sortBy = NotificationsSortBy.CREATED_AT;
      queryParams.sortDirection = SortDirection.Desc;

      queryBus.execute.mockResolvedValue(mockPaginatedNotifications);

      // Act
      const result = await controller.getHistory(queryParams, mockUserId);

      // Assert
      expect(result).toEqual(mockPaginatedNotifications);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetUserNotificationsQuery),
      );
      const query = queryBus.execute.mock
        .calls[0][0] as GetUserNotificationsQuery;
      expect(query.userId).toBe(mockUserId);
      expect(query.params).toBe(queryParams);
    });

    it('should pass correct query parameters', async () => {
      // Arrange
      const queryParams = new GetUserNotificationsParams();
      queryParams.pageNumber = 2;
      queryParams.pageSize = 20;
      queryParams.sortBy = NotificationsSortBy.CREATED_AT;
      queryParams.sortDirection = SortDirection.Asc;

      queryBus.execute.mockResolvedValue(mockPaginatedNotifications);

      // Act
      await controller.getHistory(queryParams, mockUserId);

      // Assert
      const query = queryBus.execute.mock
        .calls[0][0] as GetUserNotificationsQuery;
      expect(query.params.pageNumber).toBe(2);
      expect(query.params.pageSize).toBe(20);
      expect(query.params.sortDirection).toBe(SortDirection.Asc);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      // Arrange
      queryBus.execute.mockResolvedValue(mockUnreadCount);

      // Act
      const result = await controller.getUnreadCount(mockUserId);

      // Assert
      expect(result).toEqual(mockUnreadCount);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetUnreadCountQuery),
      );
      const query = queryBus.execute.mock.calls[0][0] as GetUnreadCountQuery;
      expect(query.userId).toBe(mockUserId);
    });

    it('should return zero when no unread notifications', async () => {
      // Arrange
      const zeroUnreadCount: UnreadCountViewDto = { unreadCount: 0 };
      queryBus.execute.mockResolvedValue(zeroUnreadCount);

      // Act
      const result = await controller.getUnreadCount(mockUserId);

      // Assert
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark notifications as read', async () => {
      // Arrange
      const dto: MarkNotificationsAsReadInputDto = {
        notificationIds: ['notification-1', 'notification-2'],
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.markNotificationsAsRead(dto, mockUserId);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(MarkNotificationsAsReadCommand),
      );
      const command = commandBus.execute.mock
        .calls[0][0] as MarkNotificationsAsReadCommand;
      expect(command.userId).toBe(mockUserId);
      expect(command.notificationIds).toEqual(dto.notificationIds);
    });

    it('should handle empty notification ids array', async () => {
      // Arrange
      const dto: MarkNotificationsAsReadInputDto = {
        notificationIds: [],
      };
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.markNotificationsAsRead(dto, mockUserId);

      // Assert
      expect(commandBus.execute).toHaveBeenCalled();
      const command = commandBus.execute.mock
        .calls[0][0] as MarkNotificationsAsReadCommand;
      expect(command.notificationIds).toEqual([]);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      // Arrange
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.deleteNotification(mockNotificationId, mockUserId);

      // Assert
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteNotificationCommand),
      );
      const command = commandBus.execute.mock
        .calls[0][0] as DeleteNotificationCommand;
      expect(command.id).toBe(mockNotificationId);
      expect(command.userId).toBe(mockUserId);
    });

    it('should handle different notification IDs', async () => {
      // Arrange
      const customNotificationId = 'custom-notification-456';
      commandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.deleteNotification(customNotificationId, mockUserId);

      // Assert
      const command = commandBus.execute.mock
        .calls[0][0] as DeleteNotificationCommand;
      expect(command.id).toBe(customNotificationId);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from queryBus', async () => {
      // Arrange
      const queryParams = new GetUserNotificationsParams();
      const error = new Error('Database error');
      queryBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.getHistory(queryParams, mockUserId),
      ).rejects.toThrow(error);
    });

    it('should propagate errors from commandBus', async () => {
      // Arrange
      const dto: MarkNotificationsAsReadInputDto = {
        notificationIds: ['notification-1'],
      };
      const error = new Error('Command error');
      commandBus.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.markNotificationsAsRead(dto, mockUserId),
      ).rejects.toThrow(error);
    });
  });
});
