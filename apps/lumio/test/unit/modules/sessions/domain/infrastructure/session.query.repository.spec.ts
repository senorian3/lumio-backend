import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { QuerySessionsRepository } from '@lumio/modules/sessions/domain/infrastructure/session.query.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

describe('QuerySessionsRepository', () => {
  let repository: QuerySessionsRepository;
  let mockPrismaService: PrismaService;

  const mockSessions: SessionEntity[] = [
    {
      id: 1,
      deviceName: 'Chrome on Windows',
      ip: '192.168.1.1',
      userId: 1,
      createdAt: new Date('2025-01-01T10:00:00Z'),
      deletedAt: null,
      expiresAt: new Date('2025-07-01T10:00:00Z'),
      deviceId: 'device-123',
      tokenVersion: 1,
      user: {} as any,
    },
    {
      id: 2,
      deviceName: 'Safari on Mac',
      ip: '192.168.1.2',
      userId: 1,
      createdAt: new Date('2025-01-02T10:00:00Z'),
      deletedAt: null,
      expiresAt: new Date('2025-07-02T10:00:00Z'),
      deviceId: 'device-456',
      tokenVersion: 1,
      user: {} as any,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuerySessionsRepository,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<QuerySessionsRepository>(QuerySessionsRepository);
    mockPrismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getAllSessions', () => {
    it('should return all active sessions for user', async () => {
      // Arrange
      const userId = 1;
      (mockPrismaService.session.findMany as jest.Mock).mockResolvedValue(
        mockSessions,
      );

      // Act
      const result = await repository.getAllSessions(userId);

      // Assert
      expect(mockPrismaService.session.findMany).toHaveBeenCalledWith({
        where: { user: { id: userId }, deletedAt: null },
      });
      expect(result).toEqual(mockSessions);
      expect(result.length).toBe(2);
    });

    it('should return empty array when user has no sessions', async () => {
      // Arrange
      const userId = 999;
      (mockPrismaService.session.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await repository.getAllSessions(userId);

      // Assert
      expect(mockPrismaService.session.findMany).toHaveBeenCalledWith({
        where: { user: { id: userId }, deletedAt: null },
      });
      expect(result).toEqual([]);
    });
  });
});
