import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { UpdateSessionDomainDto } from '@lumio/modules/sessions/domain/dto/update-sesion.domain.dto';
import { CreateSessionDomainDto } from '@lumio/modules/sessions/domain/dto/create-session.domain.dto';
import { DeleteSessionDomainDto } from '@lumio/modules/sessions/domain/dto/delete-session.domain.dto';
import { DeleteAllSessionsExcludeCurrentDomainDto } from '@lumio/modules/sessions/domain/dto/delete-all-sessions-exclude-current.domain.dto';

describe('SessionRepository', () => {
  let repository: SessionRepository;
  let prisma: any;

  const mockSession = {
    id: 1,
    userId: 1,
    deviceId: 'device-123',
    deviceName: 'Chrome on Windows',
    ip: '192.168.1.1',
    tokenVersion: 1,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      session: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<SessionRepository>(SessionRepository);
    prisma = module.get(PrismaService);
  });

  describe('findSession', () => {
    it('should find session by id', async () => {
      prisma.session.findFirst.mockResolvedValue(mockSession);

      const result = await repository.findSession({ id: 1 });

      expect(result).toEqual(mockSession);
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
      });
    });

    it('should find session by userId and deviceName', async () => {
      prisma.session.findFirst.mockResolvedValue(mockSession);

      const result = await repository.findSession({
        userId: 1,
        deviceName: 'Chrome on Windows',
      });

      expect(result).toEqual(mockSession);
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { userId: 1, deviceName: 'Chrome on Windows', deletedAt: null },
      });
    });

    it('should find session by deviceId', async () => {
      prisma.session.findFirst.mockResolvedValue(mockSession);

      const result = await repository.findSession({ deviceId: 'device-123' });

      expect(result).toEqual(mockSession);
      expect(prisma.session.findFirst).toHaveBeenCalledWith({
        where: { deviceId: 'device-123', deletedAt: null },
      });
    });

    it('should return null when session not found', async () => {
      prisma.session.findFirst.mockResolvedValue(null);

      const result = await repository.findSession({ id: 999 });

      expect(result).toBeNull();
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        session: { findFirst: jest.fn().mockResolvedValue(mockSession) },
      };

      const result = await repository.findSession({ id: 1 }, tx);

      expect(result).toEqual(mockSession);
      expect(tx.session.findFirst).toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    it('should update session with tokenVersion', async () => {
      const dto: UpdateSessionDomainDto = {
        sessionId: 1,
        iat: new Date(),
        exp: new Date(Date.now() + 3600000),
        tokenVersion: 2,
      };
      const updatedSession = { ...mockSession, tokenVersion: 2 };
      prisma.session.update.mockResolvedValue(updatedSession);

      const result = await repository.updateSession(dto);

      expect(result).toEqual(updatedSession);
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          createdAt: dto.iat,
          expiresAt: dto.exp,
          tokenVersion: 2,
        },
      });
    });

    it('should update session with same tokenVersion', async () => {
      const dto: UpdateSessionDomainDto = {
        sessionId: 1,
        iat: new Date(),
        exp: new Date(Date.now() + 3600000),
        tokenVersion: 1,
      };
      prisma.session.update.mockResolvedValue(mockSession);

      const result = await repository.updateSession(dto);

      expect(result).toEqual(mockSession);
      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          createdAt: dto.iat,
          expiresAt: dto.exp,
          tokenVersion: 1,
        },
      });
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const dto: CreateSessionDomainDto = {
        userId: 1,
        deviceId: 'device-123',
        deviceName: 'Chrome on Windows',
        ip: '192.168.1.1',
        iat: new Date(),
        exp: new Date(Date.now() + 3600000),
      };
      prisma.session.create.mockResolvedValue(mockSession);

      const result = await repository.createSession(dto);

      expect(result).toEqual(mockSession);
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          deviceId: 'device-123',
          ip: '192.168.1.1',
          deviceName: 'Chrome on Windows',
          createdAt: dto.iat,
          expiresAt: dto.exp,
          tokenVersion: 1,
        },
      });
    });
  });

  describe('deleteSession', () => {
    it('should soft delete a session', async () => {
      const dto: DeleteSessionDomainDto = {
        userId: 1,
        deviceId: 'device-123',
        sessionId: 1,
        deletedAt: new Date(),
      };
      prisma.session.update.mockResolvedValue(mockSession);

      await repository.deleteSession(dto);

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: {
          userId: 1,
          deviceId: 'device-123',
          id: 1,
        },
        data: {
          deletedAt: dto.deletedAt,
        },
      });
    });
  });

  describe('deleteAllSessionsExcludeCurrent', () => {
    it('should delete all sessions except current', async () => {
      const dto: DeleteAllSessionsExcludeCurrentDomainDto = {
        userId: 1,
        sessionId: 1,
        deletedAt: new Date(),
      };
      prisma.session.updateMany.mockResolvedValue({ count: 3 });

      await repository.deleteAllSessionsExcludeCurrent(dto);

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          id: { not: 1 },
        },
        data: { deletedAt: dto.deletedAt },
      });
    });
  });

  describe('deleteAllSessionsForUser', () => {
    it('should delete all sessions for a user', async () => {
      prisma.session.deleteMany.mockResolvedValue({ count: 3 });

      await repository.deleteAllSessionsForUser(1);

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should use transaction client when provided', async () => {
      const tx = {
        session: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      };

      await repository.deleteAllSessionsForUser(1, tx);

      expect(tx.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });
});
