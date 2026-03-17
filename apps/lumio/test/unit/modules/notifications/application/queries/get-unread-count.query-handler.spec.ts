import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUnreadCountQuery,
  GetUnreadCountQueryHandler,
} from '@lumio/modules/notifications/application/queries/get-unread-count.query-handler';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { UnreadCountViewDto } from '@lumio/modules/notifications/api/dto/output/notification.output.dto';

describe('GetUnreadCountQueryHandler', () => {
  let handler: GetUnreadCountQueryHandler;
  let mockNotificationQueryRepository: jest.Mocked<NotificationQueryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUnreadCountQueryHandler,
        {
          provide: NotificationQueryRepository,
          useValue: {
            getUnreadCount: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUnreadCountQueryHandler>(
      GetUnreadCountQueryHandler,
    );
    mockNotificationQueryRepository = module.get(NotificationQueryRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const userId = 1;

    it('should return unread count', async () => {
      // Arrange
      const expectedCount = 5;
      mockNotificationQueryRepository.getUnreadCount.mockResolvedValue(
        expectedCount,
      );
      const query = new GetUnreadCountQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual<UnreadCountViewDto>({
        unreadCount: expectedCount,
      });
      expect(
        mockNotificationQueryRepository.getUnreadCount,
      ).toHaveBeenCalledWith(userId);
    });

    it('should return zero when no unread notifications', async () => {
      // Arrange
      mockNotificationQueryRepository.getUnreadCount.mockResolvedValue(0);
      const query = new GetUnreadCountQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual<UnreadCountViewDto>({ unreadCount: 0 });
    });

    it('should pass correct userId to repository', async () => {
      // Arrange
      const customUserId = 42;
      mockNotificationQueryRepository.getUnreadCount.mockResolvedValue(10);
      const query = new GetUnreadCountQuery(customUserId);

      // Act
      await handler.execute(query);

      // Assert
      expect(
        mockNotificationQueryRepository.getUnreadCount,
      ).toHaveBeenCalledWith(customUserId);
    });

    it('should propagate database errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationQueryRepository.getUnreadCount.mockRejectedValue(dbError);
      const query = new GetUnreadCountQuery(userId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
    });

    it('should handle large unread count', async () => {
      // Arrange
      const largeCount = 999;
      mockNotificationQueryRepository.getUnreadCount.mockResolvedValue(
        largeCount,
      );
      const query = new GetUnreadCountQuery(userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.unreadCount).toBe(largeCount);
    });
  });
});

describe('GetUnreadCountQuery', () => {
  it('should create query with correct userId', () => {
    // Arrange & Act
    const userId = 42;
    const query = new GetUnreadCountQuery(userId);

    // Assert
    expect(query.userId).toBe(userId);
  });

  it('should store readonly userId', () => {
    // Arrange
    const query = new GetUnreadCountQuery(1);

    // Assert
    expect(query.userId).toBeDefined();
  });
});
