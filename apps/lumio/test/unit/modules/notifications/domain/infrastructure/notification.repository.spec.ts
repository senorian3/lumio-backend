import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { NotificationStatus } from '@lumio/modules/notifications/constants/notification-constants';
import { CreateNotificationDto } from '@lumio/modules/notifications/api/dto/transfer/create-notifications.transfer.dto';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockNotification = {
    id: '1',
    userId: 1,
    type: 'SUBSCRIPTION_ACTIVE',
    title: 'Test Notification',
    message: 'Test Message',
    status: NotificationStatus.PENDING,
    isRead: false,
    readAt: null,
    executeAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    mockPrismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create notification with all fields', async () => {
      // Arrange
      const dto: CreateNotificationDto = new CreateNotificationDto(
        1,
        'SUBSCRIPTION_ACTIVE',
        'Test Title',
        'Test Message',
        new Date().toISOString(),
      );

      (mockPrismaService.notification.create as jest.Mock).mockResolvedValue(
        mockNotification,
      );

      // Act
      const result = await repository.createNotification(dto);

      // Assert
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          executeAt: dto.executeAt,
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should handle database error on create', async () => {
      // Arrange
      const dto: CreateNotificationDto = new CreateNotificationDto(
        1,
        'SUBSCRIPTION_ACTIVE',
        'Test Title',
        'Test Message',
        new Date().toISOString(),
      );
      const dbError = new Error('Database connection failed');

      (mockPrismaService.notification.create as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(repository.createNotification(dto)).rejects.toThrow(dbError);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      // Arrange
      const userId = 1;
      (
        mockPrismaService.notification.updateMany as jest.Mock
      ).mockResolvedValue({ count: 5 });

      // Act
      await repository.markAllAsRead(userId);

      // Assert
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should handle case when no unread notifications exist', async () => {
      // Arrange
      const userId = 1;
      (
        mockPrismaService.notification.updateMany as jest.Mock
      ).mockResolvedValue({ count: 0 });

      // Act
      await repository.markAllAsRead(userId);

      // Assert
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should handle database error', async () => {
      // Arrange
      const userId = 1;
      const dbError = new Error('Database error');
      (
        mockPrismaService.notification.updateMany as jest.Mock
      ).mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.markAllAsRead(userId)).rejects.toThrow(dbError);
    });
  });

  describe('findPendingNotifications', () => {
    it('should find pending notifications with default limit', async () => {
      // Arrange
      const mockNotifications = [mockNotification];
      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockNotifications,
      );

      // Act
      const result = await repository.findPendingNotifications();

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          executeAt: { lte: expect.any(Date) },
          status: NotificationStatus.PENDING,
        },
        orderBy: { executeAt: 'asc' },
        take: 100,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should find pending notifications with custom limit', async () => {
      // Arrange
      const customLimit = 50;
      const mockNotifications = [mockNotification];
      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockNotifications,
      );

      // Act
      const result = await repository.findPendingNotifications(customLimit);

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          executeAt: { lte: expect.any(Date) },
          status: NotificationStatus.PENDING,
        },
        orderBy: { executeAt: 'asc' },
        take: customLimit,
      });
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array when no pending notifications', async () => {
      // Arrange
      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      // Act
      const result = await repository.findPendingNotifications();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle database error', async () => {
      // Arrange
      const dbError = new Error('Database error');
      (mockPrismaService.notification.findMany as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(repository.findPendingNotifications()).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('markAsSent', () => {
    it('should update notification status to SENT', async () => {
      // Arrange
      const notificationId = '1';
      (mockPrismaService.notification.update as jest.Mock).mockResolvedValue(
        mockNotification,
      );

      // Act
      await repository.markAsSent(notificationId);

      // Assert
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { status: NotificationStatus.SENT },
      });
    });

    it('should handle database error', async () => {
      // Arrange
      const notificationId = '1';
      const dbError = new Error('Database error');
      (mockPrismaService.notification.update as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(repository.markAsSent(notificationId)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('markAsFailed', () => {
    it('should update notification status to FAILED', async () => {
      // Arrange
      const notificationId = '1';
      (mockPrismaService.notification.update as jest.Mock).mockResolvedValue(
        mockNotification,
      );

      // Act
      await repository.markAsFailed(notificationId);

      // Assert
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });
    });

    it('should handle database error', async () => {
      // Arrange
      const notificationId = '1';
      const dbError = new Error('Database error');
      (mockPrismaService.notification.update as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(repository.markAsFailed(notificationId)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications for user', async () => {
      // Arrange
      const userId = 1;
      const expectedCount = 5;
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        expectedCount,
      );

      // Act
      const result = await repository.getUnreadCount(userId);

      // Assert
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
          deletedAt: null,
        },
      });
      expect(result).toBe(expectedCount);
    });

    it('should return 0 when no unread notifications', async () => {
      // Arrange
      const userId = 1;
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.getUnreadCount(userId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle database error', async () => {
      // Arrange
      const userId = 1;
      const dbError = new Error('Database error');
      (mockPrismaService.notification.count as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(repository.getUnreadCount(userId)).rejects.toThrow(dbError);
    });
  });
});
