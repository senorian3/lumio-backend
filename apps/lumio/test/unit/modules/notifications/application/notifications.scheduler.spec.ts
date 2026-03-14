import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsScheduler } from '@lumio/modules/notifications/application/notifications.scheduler';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { NotificationsGateway } from '@lumio/modules/notifications/application/notifications.gateway';
import { AppLoggerService } from '@libs/logger/logger.service';
import { NotificationStatus } from '@lumio/modules/notifications/constants/notification-constants';

describe('NotificationsScheduler', () => {
  let scheduler: NotificationsScheduler;
  let mockNotificationRepository: jest.Mocked<NotificationRepository>;
  let mockNotificationsGateway: jest.Mocked<NotificationsGateway>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const createMockNotification = (
    id: string,
    userId: number,
    title: string,
    message: string,
  ) => ({
    id,
    userId,
    type: 'SUBSCRIPTION_ACTIVE',
    title,
    message,
    status: NotificationStatus.PENDING,
    isRead: false,
    readAt: null,
    executeAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsScheduler,
        {
          provide: NotificationRepository,
          useValue: {
            findPendingNotifications: jest.fn(),
            markAsSent: jest.fn(),
            markAsFailed: jest.fn(),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            sendNotification: jest.fn(),
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
      ],
    }).compile();

    scheduler = module.get<NotificationsScheduler>(NotificationsScheduler);
    mockNotificationRepository = module.get(NotificationRepository);
    mockNotificationsGateway = module.get(NotificationsGateway);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('processPendingNotifications', () => {
    it('should process pending notifications and mark them as sent', async () => {
      // Arrange
      const mockNotifications = [
        createMockNotification('1', 1, 'Title 1', 'Message 1'),
        createMockNotification('2', 2, 'Title 2', 'Message 2'),
      ];

      mockNotificationRepository.findPendingNotifications.mockResolvedValue(
        mockNotifications,
      );
      mockNotificationsGateway.sendNotification.mockResolvedValue(undefined);
      mockNotificationRepository.markAsSent.mockResolvedValue(undefined);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(
        mockNotificationRepository.findPendingNotifications,
      ).toHaveBeenCalledWith(100);
      expect(mockNotificationsGateway.sendNotification).toHaveBeenCalledTimes(
        2,
      );
      expect(mockNotificationsGateway.sendNotification).toHaveBeenCalledWith(
        1,
        'Title 1',
        'Message 1',
      );
      expect(mockNotificationsGateway.sendNotification).toHaveBeenCalledWith(
        2,
        'Title 2',
        'Message 2',
      );
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledTimes(2);
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledWith('1');
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledWith('2');
    });

    it('should return early when no pending notifications', async () => {
      // Arrange
      mockNotificationRepository.findPendingNotifications.mockResolvedValue([]);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(
        mockNotificationRepository.findPendingNotifications,
      ).toHaveBeenCalledWith(100);
      expect(mockNotificationsGateway.sendNotification).not.toHaveBeenCalled();
      expect(mockNotificationRepository.markAsSent).not.toHaveBeenCalled();
    });

    it('should mark notification as failed when gateway throws error', async () => {
      // Arrange
      const mockNotification = createMockNotification(
        '1',
        1,
        'Title',
        'Message',
      );
      mockNotificationRepository.findPendingNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockNotificationsGateway.sendNotification.mockRejectedValue(
        new Error('Gateway error'),
      );
      mockNotificationRepository.markAsFailed.mockResolvedValue(undefined);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockNotificationRepository.markAsFailed).toHaveBeenCalledWith('1');
      expect(mockNotificationRepository.markAsSent).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error in notifications scheduler for notification 1',
        ),
        expect.any(String),
        'NotificationsScheduler',
      );
    });

    it('should continue processing other notifications when one fails', async () => {
      // Arrange
      const mockNotifications = [
        createMockNotification('1', 1, 'Title 1', 'Message 1'),
        createMockNotification('2', 2, 'Title 2', 'Message 2'),
        createMockNotification('3', 3, 'Title 3', 'Message 3'),
      ];

      mockNotificationRepository.findPendingNotifications.mockResolvedValue(
        mockNotifications,
      );
      mockNotificationsGateway.sendNotification
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Gateway error'))
        .mockResolvedValueOnce(undefined);
      mockNotificationRepository.markAsSent.mockResolvedValue(undefined);
      mockNotificationRepository.markAsFailed.mockResolvedValue(undefined);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledWith('1');
      expect(mockNotificationRepository.markAsFailed).toHaveBeenCalledWith('2');
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledWith('3');
      expect(mockNotificationRepository.markAsSent).toHaveBeenCalledTimes(2);
      expect(mockNotificationRepository.markAsFailed).toHaveBeenCalledTimes(1);
    });

    it('should log error when findPendingNotifications fails', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockNotificationRepository.findPendingNotifications.mockRejectedValue(
        dbError,
      );

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error in notifications scheduler'),
        expect.any(String),
        'NotificationsScheduler',
      );
      expect(mockNotificationsGateway.sendNotification).not.toHaveBeenCalled();
    });

    it('should handle markAsSent failure gracefully', async () => {
      // Arrange
      const mockNotification = createMockNotification(
        '1',
        1,
        'Title',
        'Message',
      );
      mockNotificationRepository.findPendingNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockNotificationsGateway.sendNotification.mockResolvedValue(undefined);
      mockNotificationRepository.markAsSent.mockRejectedValue(
        new Error('Mark as sent failed'),
      );
      mockNotificationRepository.markAsFailed.mockResolvedValue(undefined);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockNotificationRepository.markAsFailed).toHaveBeenCalledWith('1');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle markAsFailed failure gracefully', async () => {
      // Arrange
      const mockNotification = createMockNotification(
        '1',
        1,
        'Title',
        'Message',
      );
      mockNotificationRepository.findPendingNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockNotificationsGateway.sendNotification.mockRejectedValue(
        new Error('Gateway error'),
      );
      mockNotificationRepository.markAsFailed.mockRejectedValue(
        new Error('Mark as failed error'),
      );

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should send notification with correct parameters', async () => {
      // Arrange
      const mockNotification = createMockNotification(
        '1',
        42,
        'Subscription Active',
        'Your subscription is now active',
      );
      mockNotificationRepository.findPendingNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockNotificationsGateway.sendNotification.mockResolvedValue(undefined);
      mockNotificationRepository.markAsSent.mockResolvedValue(undefined);

      // Act
      await scheduler.processPendingNotifications();

      // Assert
      expect(mockNotificationsGateway.sendNotification).toHaveBeenCalledWith(
        42,
        'Subscription Active',
        'Your subscription is now active',
      );
    });
  });
});
