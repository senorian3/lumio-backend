import { Test, TestingModule } from '@nestjs/testing';
import { NotificationQueryRepository } from '@lumio/modules/notifications/domain/infrastructure/notification.query-repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { NotificationPaginationTransferDto } from '@lumio/modules/notifications/api/dto/transfer/notification-pagination.transfer.dto';

describe('NotificationQueryRepository', () => {
  let repository: NotificationQueryRepository;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockNotification = {
    id: '1',
    title: 'Test Notification',
    message: 'Test Message',
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
  };

  const createMockPaginationResult = (
    items: any[],
    total: number,
    pageNumber: number,
    pageSize: number,
  ): NotificationPaginationTransferDto => ({
    items,
    total,
    pageNumber,
    pageSize,
    pagesCount: Math.ceil(total / pageSize),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueryRepository,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationQueryRepository>(
      NotificationQueryRepository,
    );
    mockPrismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getHistory', () => {
    it('should return paginated history with default parameters', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      const mockItems = [mockNotification];
      const mockTotal = 1;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      const expectedResult = createMockPaginationResult(
        mockItems,
        mockTotal,
        pageNumber,
        pageSize,
      );

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
          createdAt: {
            gte: expect.any(Date),
          },
        },
        skip: 0,
        take: pageSize,
        orderBy: {
          createdAt: sortDirection,
        },
        select: {
          id: true,
          title: true,
          message: true,
          createdAt: true,
        },
      });
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should filter notifications from last 30 days', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      const mockItems = [mockNotification];
      const mockTotal = 1;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      await repository.getHistory(userId, pageNumber, pageSize, sortDirection);

      // Assert
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const call = (mockPrismaService.notification.findMany as jest.Mock).mock
        .calls[0][0];
      const createdAtFilter = call.where.createdAt.gte;

      expect(createdAtFilter.getTime()).toBeGreaterThanOrEqual(
        thirtyDaysAgo.getTime() - 1000,
      );
      expect(createdAtFilter.getTime()).toBeLessThanOrEqual(
        thirtyDaysAgo.getTime() + 1000,
      );
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 3;
      const pageSize = 20;
      const sortDirection = 'asc' as const;

      const mockItems = Array(20).fill(mockNotification);
      const mockTotal = 100;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 40, // (pageNumber - 1) * pageSize = (3 - 1) * 20 = 40
        take: pageSize,
        orderBy: {
          createdAt: sortDirection,
        },
        select: expect.any(Object),
      });
      expect(result.pageNumber).toBe(pageNumber);
      expect(result.pageSize).toBe(pageSize);
      expect(result.total).toBe(mockTotal);
      expect(result.pagesCount).toBe(5); // Math.ceil(100 / 20) = 5
    });

    it('should limit pageSize to maximum 100', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 150; // Above max
      const sortDirection = 'desc' as const;

      const mockItems = [mockNotification];
      const mockTotal = 1;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 0,
        take: 100, // Limited to max 100
        orderBy: {
          createdAt: sortDirection,
        },
        select: expect.any(Object),
      });
      expect(result.pageSize).toBe(100);
    });

    it('should handle minimum pageSize of 1', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 0; // Below min
      const sortDirection = 'desc' as const;

      const mockItems = [mockNotification];
      const mockTotal = 1;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 0,
        take: 1, // Limited to min 1
        orderBy: {
          createdAt: sortDirection,
        },
        select: expect.any(Object),
      });
      expect(result.pageSize).toBe(1);
    });

    it('should handle empty history', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.pagesCount).toBe(0);
    });

    it('should handle database error in findMany', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      const dbError = new Error('Database connection failed');
      (mockPrismaService.notification.findMany as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(
        repository.getHistory(userId, pageNumber, pageSize, sortDirection),
      ).rejects.toThrow(dbError);
    });

    it('should handle database error in count', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      const mockItems = [mockNotification];
      const dbError = new Error('Database connection failed');

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(
        repository.getHistory(userId, pageNumber, pageSize, sortDirection),
      ).rejects.toThrow(dbError);
    });

    it('should map items correctly', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'desc' as const;

      const mockItems = [
        {
          id: '1',
          title: 'Notification 1',
          message: 'Message 1',
          createdAt: new Date('2025-01-01T10:00:00.000Z'),
        },
        {
          id: '2',
          title: 'Notification 2',
          message: 'Message 2',
          createdAt: new Date('2025-01-02T10:00:00.000Z'),
        },
      ];
      const mockTotal = 2;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      const result = await repository.getHistory(
        userId,
        pageNumber,
        pageSize,
        sortDirection,
      );

      // Assert
      expect(result.items).toEqual(mockItems);
      expect(result.items[0].id).toBe('1');
      expect(result.items[0].title).toBe('Notification 1');
      expect(result.items[0].message).toBe('Message 1');
      expect(result.items[0].createdAt).toEqual(
        new Date('2025-01-01T10:00:00.000Z'),
      );
    });

    it('should handle ascending sort direction', async () => {
      // Arrange
      const userId = 1;
      const pageNumber = 1;
      const pageSize = 10;
      const sortDirection = 'asc' as const;

      const mockItems = [mockNotification];
      const mockTotal = 1;

      (mockPrismaService.notification.findMany as jest.Mock).mockResolvedValue(
        mockItems,
      );
      (mockPrismaService.notification.count as jest.Mock).mockResolvedValue(
        mockTotal,
      );

      // Act
      await repository.getHistory(userId, pageNumber, pageSize, sortDirection);

      // Assert
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 0,
        take: pageSize,
        orderBy: {
          createdAt: 'asc',
        },
        select: expect.any(Object),
      });
    });
  });
});
