import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUserNotificationsQuery,
  GetUserNotificationsQueryHandler,
} from '@lumio/modules/notifications/application/queries/get-user-notifications.query-handler';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import {
  GetUserNotificationsParams,
  NotificationsSortBy,
} from '@lumio/modules/notifications/api/dto/input/get-user-notifications.query';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { NotificationViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';
import { SortDirection } from '@libs/core/dto/pagination/base.query-params.input-dto';

describe('GetUserNotificationsQueryHandler', () => {
  let handler: GetUserNotificationsQueryHandler;
  let mockNotificationQueryRepository: jest.Mocked<NotificationQueryRepository>;

  const mockUserId = 1;

  const createMockParams = (
    overrides: Partial<GetUserNotificationsParams> = {},
  ): GetUserNotificationsParams => {
    const params = new GetUserNotificationsParams();
    params.pageNumber = overrides.pageNumber ?? 1;
    params.pageSize = overrides.pageSize ?? 10;
    params.sortBy = overrides.sortBy ?? NotificationsSortBy.CREATED_AT;
    params.sortDirection = overrides.sortDirection ?? SortDirection.Desc;
    return params;
  };

  const mockPaginatedResult: PaginatedViewDto<NotificationViewDto[]> = {
    items: [
      {
        id: 'notification-1',
        title: 'Test notification 1',
        message: 'Test message 1',
        isRead: false,
        createdAt: new Date('2026-03-15'),
      },
      {
        id: 'notification-2',
        title: 'Test notification 2',
        message: 'Test message 2',
        isRead: true,
        createdAt: new Date('2026-03-14'),
      },
    ],
    totalCount: 2,
    pageSize: 10,
    page: 1,
    pagesCount: 1,
    unreadCount: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserNotificationsQueryHandler,
        {
          provide: NotificationQueryRepository,
          useValue: {
            getHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUserNotificationsQueryHandler>(
      GetUserNotificationsQueryHandler,
    );
    mockNotificationQueryRepository = module.get(NotificationQueryRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated notifications', async () => {
      // Arrange
      const mockParams = createMockParams();
      mockNotificationQueryRepository.getHistory.mockResolvedValue(
        mockPaginatedResult,
      );
      const query = new GetUserNotificationsQuery(mockUserId, mockParams);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(mockNotificationQueryRepository.getHistory).toHaveBeenCalledWith(
        mockUserId,
        mockParams,
      );
    });

    it('should pass correct userId and params to repository', async () => {
      // Arrange
      const customUserId = 42;
      const customParams = createMockParams({
        pageNumber: 2,
        pageSize: 20,
        sortDirection: SortDirection.Asc,
      });
      mockNotificationQueryRepository.getHistory.mockResolvedValue(
        mockPaginatedResult,
      );
      const query = new GetUserNotificationsQuery(customUserId, customParams);

      // Act
      await handler.execute(query);

      // Assert
      expect(mockNotificationQueryRepository.getHistory).toHaveBeenCalledWith(
        customUserId,
        customParams,
      );
    });

    it('should return empty result when no notifications', async () => {
      // Arrange
      const emptyResult: PaginatedViewDto<NotificationViewDto[]> = {
        items: [],
        totalCount: 0,
        pageSize: 10,
        page: 1,
        pagesCount: 0,
        unreadCount: 0,
      };
      mockNotificationQueryRepository.getHistory.mockResolvedValue(emptyResult);
      const mockParams = createMockParams();
      const query = new GetUserNotificationsQuery(mockUserId, mockParams);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationQueryRepository.getHistory.mockRejectedValue(dbError);
      const mockParams = createMockParams();
      const query = new GetUserNotificationsQuery(mockUserId, mockParams);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const paginatedResult: PaginatedViewDto<NotificationViewDto[]> = {
        items: [
          {
            id: 'notification-11',
            title: 'Notification on page 2',
            message: 'Message',
            isRead: false,
            createdAt: new Date(),
          },
        ],
        totalCount: 15,
        pageSize: 10,
        page: 2,
        pagesCount: 2,
        unreadCount: 5,
      };
      mockNotificationQueryRepository.getHistory.mockResolvedValue(
        paginatedResult,
      );
      const paramsPage2 = createMockParams({ pageNumber: 2 });
      const query = new GetUserNotificationsQuery(mockUserId, paramsPage2);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.page).toBe(2);
      expect(result.pagesCount).toBe(2);
      expect(result.totalCount).toBe(15);
    });
  });
});

describe('GetUserNotificationsQuery', () => {
  it('should create query with correct properties', () => {
    // Arrange
    const userId = 1;
    const params = new GetUserNotificationsParams();
    params.pageNumber = 1;
    params.pageSize = 10;
    params.sortBy = NotificationsSortBy.CREATED_AT;
    params.sortDirection = SortDirection.Desc;

    // Act
    const query = new GetUserNotificationsQuery(userId, params);

    // Assert
    expect(query.userId).toBe(userId);
    expect(query.params).toEqual(params);
  });

  it('should store reference to params object', () => {
    // Arrange
    const params = new GetUserNotificationsParams();
    params.pageNumber = 1;
    params.pageSize = 10;
    params.sortBy = NotificationsSortBy.CREATED_AT;
    params.sortDirection = SortDirection.Desc;

    // Act
    const query = new GetUserNotificationsQuery(1, params);

    // Assert
    expect(query.params).toBe(params);
  });
});
