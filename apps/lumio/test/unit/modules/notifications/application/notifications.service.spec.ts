import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '@lumio/modules/notifications/application/notifications.service';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { NotificationType } from '@lumio/modules/notifications/constants/notification-constants';
import { SubscriptionActiveNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/subscription-active-notification.transfer.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;

  const mockUserId = 1;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: {
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    mockNotificationRepository = module.get(NotificationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubscriptionActiveNotification', () => {
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
      await service.createSubscriptionActiveNotification(dto);

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
      await service.createSubscriptionActiveNotification(dto);

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
        service.createSubscriptionActiveNotification(dto),
      ).rejects.toThrow(dbError);
    });
  });

  describe('createPaymentWarningNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.createPaymentWarningNotification(mockUserId, endDate);

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

    it('should include payment warning text in message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.createPaymentWarningNotification(mockUserId, endDate);

      // Assert
      const call =
        mockNotificationRepository.createNotification.mock.calls[0][0];
      expect(call.message).toContain('через 1 день');
    });

    it('should handle database error', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      const dbError = new Error('Database error');
      mockNotificationRepository.createNotification.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.createPaymentWarningNotification(mockUserId, endDate),
      ).rejects.toThrow(dbError);
    });
  });

  describe('createSubscriptionExpiring1DayNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.createSubscriptionExpiring1DayNotification(
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
      await service.createSubscriptionExpiring1DayNotification(
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
        service.createSubscriptionExpiring1DayNotification(mockUserId, endDate),
      ).rejects.toThrow(dbError);
    });
  });

  describe('createSubscriptionExpiring7DaysNotification', () => {
    it('should create notification with correct type and message', async () => {
      // Arrange
      const endDate = new Date('2025-12-31');
      mockNotificationRepository.createNotification.mockResolvedValue(
        {} as any,
      );

      // Act
      await service.createSubscriptionExpiring7DaysNotification(
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
      await service.createSubscriptionExpiring7DaysNotification(
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
        service.createSubscriptionExpiring7DaysNotification(
          mockUserId,
          endDate,
        ),
      ).rejects.toThrow(dbError);
    });
  });
});
