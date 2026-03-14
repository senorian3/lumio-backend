import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { NotificationType } from '@lumio/modules/notifications/constants/notification-constants';
import { SubscriptionActiveNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/subscription-active-notification.transfer.dto';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationQueryRepository: jest.Mocked<NotificationQueryRepository>;

  const mockUserId = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: {
            markAllAsRead: jest.fn(),
            getUnreadCount: jest.fn(),
            createNotification: jest.fn(),
          },
        },
        {
          provide: NotificationQueryRepository,
          useValue: {
            getHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    mockNotificationRepository = module.get(NotificationRepository);
    mockNotificationQueryRepository = module.get(NotificationQueryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('markAllAsRead', () => {
    it('should call repository markAllAsRead with userId', async () => {
      // Arrange
      mockNotificationRepository.markAllAsRead.mockResolvedValue(undefined);

      // Act
      await service.markAllAsRead(mockUserId);

      // Assert
      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockNotificationRepository.markAllAsRead.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.markAllAsRead(mockUserId)).rejects.toThrow(dbError);
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('should return unread count from repository', async () => {
      // Arrange
      const expectedCount = 5;
      mockNotificationRepository.getUnreadCount.mockResolvedValue(
        expectedCount,
      );

      // Act
      const result = await service.getUnreadNotificationsCount(mockUserId);

      // Assert
      expect(result).toBe(expectedCount);
      expect(mockNotificationRepository.getUnreadCount).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should return 0 when no unread notifications', async () => {
      // Arrange
      mockNotificationRepository.getUnreadCount.mockResolvedValue(0);

      // Act
      const result = await service.getUnreadNotificationsCount(mockUserId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationRepository.getUnreadCount.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.getUnreadNotificationsCount(mockUserId),
      ).rejects.toThrow(dbError);
    });
  });

  describe('getHistory', () => {
    const mockPaginationResult: NotificationPaginationTransferDto = {
      items: [
        {
          id: '1',
          title: 'Test notification',
          message: 'Test message',
          createdAt: new Date(),
        },
      ],
      total: 1,
      pageNumber: 1,
      pageSize: 10,
      pagesCount: 1,
    };

    it('should return paginated history with default parameters', async () => {
      // Arrange
      mockNotificationQueryRepository.getHistory.mockResolvedValue(
        mockPaginationResult,
      );

      // Act
      const result = await service.getHistory(mockUserId);

      // Assert
      expect(result).toEqual(mockPaginationResult);
      expect(mockNotificationQueryRepository.getHistory).toHaveBeenCalledWith(
        mockUserId,
        1,
        10,
        'desc',
      );
    });

    it('should pass custom pagination parameters', async () => {
      // Arrange
      mockNotificationQueryRepository.getHistory.mockResolvedValue(
        mockPaginationResult,
      );
      const pageNumber = 2;
      const pageSize = 20;
      const sortDirection = 'asc' as const;

      // Act
      const result = await service.getHistory(
        mockUserId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(result).toEqual(mockPaginationResult);
      expect(mockNotificationQueryRepository.getHistory).toHaveBeenCalledWith(
        mockUserId,
        pageNumber,
        pageSize,
        sortDirection,
      );
    });

    it('should handle empty history', async () => {
      // Arrange
      const emptyResult: NotificationPaginationTransferDto = {
        items: [],
        total: 0,
        pageNumber: 1,
        pageSize: 10,
        pagesCount: 0,
      };
      mockNotificationQueryRepository.getHistory.mockResolvedValue(emptyResult);

      // Act
      const result = await service.getHistory(mockUserId);

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockNotificationQueryRepository.getHistory.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.getHistory(mockUserId)).rejects.toThrow(dbError);
    });
  });

  describe('sendSubscriptionActiveNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const subscriptionDate = new Date('2025-12-31');
      const dto = new SubscriptionActiveNotificationDto(
        mockUserId,
        subscriptionDate,
      );
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionActiveNotification(dto);

      // Assert
      expect(
        mockNotificationRepository.createNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.SUBSCRIPTION_ACTIVE,
          title: 'Подписка активирована',
          message: expect.stringContaining(
            subscriptionDate.toLocaleDateString(),
          ),
          executeAt: expect.any(String),
        }),
      );
    });

    it('should set executeAt to 30 seconds in the future', async () => {
      // Arrange
      const subscriptionDate = new Date('2025-12-31');
      const dto = new SubscriptionActiveNotificationDto(
        mockUserId,
        subscriptionDate,
      );
      const beforeCall = new Date().getTime();
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionActiveNotification(dto);

      // Assert
      const call =
        mockNotificationRepository.createNotification.mock.calls[0][0];
      const executeAtTime = new Date(call.executeAt).getTime();
      const afterCall = new Date().getTime() + 30000;

      expect(executeAtTime).toBeGreaterThanOrEqual(beforeCall + 30000 - 1000);
      expect(executeAtTime).toBeLessThanOrEqual(afterCall + 1000);
    });

    it('should handle database error', async () => {
      // Arrange
      const dto = new SubscriptionActiveNotificationDto(mockUserId, new Date());
      const dbError = new Error('Database error');
      mockNotificationRepository.createNotification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.sendSubscriptionActiveNotification(dto),
      ).rejects.toThrow(dbError);
    });
  });

  describe('sendPaymentWarningNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendPaymentWarningNotification(mockUserId, endDate);

      // Assert
      expect(
        mockNotificationRepository.createNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.PAYMENT_WARNING,
          title: 'Уведомление о платеже',
          message: expect.stringContaining(endDate.toLocaleDateString()),
          executeAt: expect.any(String),
        }),
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      const dbError = new Error('Database error');
      mockNotificationRepository.createNotification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.sendPaymentWarningNotification(mockUserId, endDate),
      ).rejects.toThrow(dbError);
    });
  });

  describe('sendSubscriptionExpiring1DayNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionExpiring1DayNotification(
        mockUserId,
        endDate,
      );

      // Assert
      expect(
        mockNotificationRepository.createNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.SUBSCRIPTION_EXPIRING_1DAY,
          title: 'Подписка истекает',
          message: expect.stringContaining('1 день'),
          executeAt: expect.any(String),
        }),
      );
    });

    it('should include end date in message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionExpiring1DayNotification(
        mockUserId,
        endDate,
      );

      // Assert
      const call =
        mockNotificationRepository.createNotification.mock.calls[0][0];
      expect(call.message).toContain(endDate.toLocaleDateString());
    });

    it('should handle database error', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      const dbError = new Error('Database error');
      mockNotificationRepository.createNotification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.sendSubscriptionExpiring1DayNotification(mockUserId, endDate),
      ).rejects.toThrow(dbError);
    });
  });

  describe('sendSubscriptionExpiring7DaysNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionExpiring7DaysNotification(
        mockUserId,
        endDate,
      );

      // Assert
      expect(
        mockNotificationRepository.createNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.SUBSCRIPTION_EXPIRING_7DAYS,
          title: 'Подписка истекает',
          message: expect.stringContaining('7 дней'),
          executeAt: expect.any(String),
        }),
      );
    });

    it('should include end date in message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.sendSubscriptionExpiring7DaysNotification(
        mockUserId,
        endDate,
      );

      // Assert
      const call =
        mockNotificationRepository.createNotification.mock.calls[0][0];
      expect(call.message).toContain(endDate.toLocaleDateString());
    });

    it('should handle database error', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      const dbError = new Error('Database error');
      mockNotificationRepository.createNotification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.sendSubscriptionExpiring7DaysNotification(mockUserId, endDate),
      ).rejects.toThrow(dbError);
    });
  });
});
