import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let mockPrismaService: PrismaService;

  const mockSession: SessionEntity = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionRepository,
        {
          provide: PrismaService,
          useValue: {
            session: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<SessionRepository>(SessionRepository);
    mockPrismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findSession', () => {
    it('should find session by userId and deviceName', async () => {
      // Arrange
      const filters = { userId: 1, deviceName: 'Chrome' };
      (mockPrismaService.session.findFirst as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      const result = await repository.findSession(filters);

      // Assert
      expect(mockPrismaService.session.findFirst).toHaveBeenCalledWith({
        where: { deletedAt: null, userId: 1, deviceName: 'Chrome' },
      });
      expect(result).toEqual(mockSession);
    });

    it('should find session by deviceId', async () => {
      // Arrange
      const filters = { deviceId: 'device-123' };
      (mockPrismaService.session.findFirst as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      const result = await repository.findSession(filters);

      // Assert
      expect(mockPrismaService.session.findFirst).toHaveBeenCalledWith({
        where: { deletedAt: null, deviceId: 'device-123' },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null when session not found', async () => {
      // Arrange
      const filters = { userId: 999 };
      (mockPrismaService.session.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      // Act
      const result = await repository.findSession(filters);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session with new iat and exp', async () => {
      // Arrange
      const dto = {
        sessionId: 1,
        iat: new Date('2025-01-02T10:00:00Z'),
        exp: new Date('2025-07-02T10:00:00Z'),
        tokenVersion: 1,
      };
      const updatedSession = {
        ...mockSession,
        createdAt: dto.iat,
        expiresAt: dto.exp,
      };
      (mockPrismaService.session.update as jest.Mock).mockResolvedValue(
        updatedSession,
      );

      // Act
      const result = await repository.updateSession(dto);

      // Assert
      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          createdAt: dto.iat,
          expiresAt: dto.exp,
          tokenVersion: dto.tokenVersion,
        },
      });
      expect(result).toEqual(updatedSession);
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      // Arrange
      const dto = {
        userId: 1,
        deviceId: 'device-123',
        ip: '192.168.1.1',
        deviceName: 'Chrome',
        iat: new Date('2025-01-01T10:00:00Z'),
        exp: new Date('2025-07-01T10:00:00Z'),
      };
      (mockPrismaService.session.create as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      const result = await repository.createSession(dto);

      // Assert
      expect(mockPrismaService.session.create).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          deviceId: dto.deviceId,
          ip: dto.ip,
          deviceName: dto.deviceName,
          createdAt: dto.iat,
          expiresAt: dto.exp,
          tokenVersion: 1,
        },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('deleteSession', () => {
    it('should soft delete session', async () => {
      // Arrange
      const dto = {
        userId: 1,
        deviceId: 'device-123',
        sessionId: 1,
        deletedAt: new Date('2025-01-02T10:00:00Z'),
      };
      (mockPrismaService.session.update as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      await repository.deleteSession(dto);

      // Assert
      expect(mockPrismaService.session.update).toHaveBeenCalledWith({
        where: { userId: 1, deviceId: 'device-123', id: 1 },
        data: { deletedAt: dto.deletedAt },
      });
    });
  });

  describe('deleteAllSessionsExcludeCurrent', () => {
    it('should soft delete all sessions except current', async () => {
      // Arrange
      const dto = {
        userId: 1,
        sessionId: 5,
        deletedAt: new Date('2025-01-02T10:00:00Z'),
      };
      (mockPrismaService.session.updateMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      // Act
      await repository.deleteAllSessionsExcludeCurrent(dto);

      // Assert
      expect(mockPrismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, id: { not: 5 } },
        data: { deletedAt: dto.deletedAt },
      });
    });
  });

  describe('deleteAllSessionsForUser', () => {
    it('should delete all sessions for user', async () => {
      // Arrange
      const userId = 1;
      (mockPrismaService.session.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      // Act
      await repository.deleteAllSessionsForUser(userId);

      // Assert
      expect(mockPrismaService.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });
});
