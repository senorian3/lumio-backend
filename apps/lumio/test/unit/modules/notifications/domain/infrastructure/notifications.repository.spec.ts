import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { NotificationStatus } from '@lumio/modules/notifications/constants/notification-constants';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(NotificationRepository);
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const data = {
        userId: 1,
        type: 'POST_LIKED',
        title: 'New like',
        message: 'Someone liked your post',
        executeAt: new Date(),
      };
      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        ...data,
      });

      const result = await repository.createNotification(data as any);

      expect(result).toEqual({ id: 'notif-1', ...data });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: 'POST_LIKED',
          title: 'New like',
          message: 'Someone liked your post',
          executeAt: expect.any(Date),
        },
      });
    });
  });

  describe('markNotificationsAsRead', () => {
    it('should mark notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });

      await repository.markNotificationsAsRead(1, ['notif-1', 'notif-2']);

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['notif-1', 'notif-2'] },
          userId: 1,
          deletedAt: null,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete a notification', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.softDelete('notif-1', 1);

      expect(result).toBe(true);
    });

    it('should return false when notification not found', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.softDelete('notif-1', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPendingNotifications', () => {
    it('should find pending notifications', async () => {
      const mockNotifications = [
        { id: 'notif-1', status: NotificationStatus.PENDING },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await repository.findPendingNotifications(100);

      expect(result).toEqual(mockNotifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          executeAt: { lte: expect.any(Date) },
          status: NotificationStatus.PENDING,
        },
        orderBy: { executeAt: 'asc' },
        take: 100,
      });
    });
  });

  describe('markAsSent', () => {
    it('should mark notification as sent', async () => {
      mockPrisma.notification.update.mockResolvedValue({});

      await repository.markAsSent('notif-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { status: NotificationStatus.SENT },
      });
    });
  });

  describe('markAsFailed', () => {
    it('should mark notification as failed', async () => {
      mockPrisma.notification.update.mockResolvedValue({});

      await repository.markAsFailed('notif-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { status: NotificationStatus.FAILED },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await repository.getUnreadCount(1);

      expect(result).toBe(5);
    });
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockNotification = { id: 'notif-1', userId: 1 };
      mockPrisma.notification.findFirst.mockResolvedValue(mockNotification);

      const result = await repository.findById('notif-1', 1);

      expect(result).toEqual(mockNotification);
    });

    it('should return null when notification not found', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await repository.findById('notif-1', 1);

      expect(result).toBeNull();
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete old notifications', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repository.deleteOldNotifications(30);

      expect(result).toBe(10);
    });
  });
});
