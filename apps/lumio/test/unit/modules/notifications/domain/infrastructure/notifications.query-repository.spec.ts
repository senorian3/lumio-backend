import { Test, TestingModule } from '@nestjs/testing';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notifications.query-repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('NotificationQueryRepository', () => {
  let repository: NotificationQueryRepository;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueryRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(NotificationQueryRepository);
    jest.clearAllMocks();
  });

  describe('getHistory', () => {
    it('should return paginated notification history', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Title 1',
          message: 'Message 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          title: 'Title 2',
          message: 'Message 2',
          isRead: true,
          createdAt: new Date(),
        },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count
        .mockResolvedValueOnce(2) // total count
        .mockResolvedValueOnce(1); // unread count

      const result = await repository.getHistory(1, {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: 'desc',
      } as any);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.unreadCount).toBe(1);
    });

    it('should return empty array when no notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await repository.getHistory(1, {
        pageNumber: 1,
        pageSize: 10,
        sortDirection: 'desc',
      } as any);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await repository.getUnreadCount(1);

      expect(result).toBe(3);
    });
  });
});
