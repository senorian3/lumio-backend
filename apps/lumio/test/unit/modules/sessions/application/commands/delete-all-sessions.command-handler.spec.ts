import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  DeleteAllSessionsCommandHandler,
  DeleteAllSessionsCommand,
} from '@lumio/modules/sessions/application/commands/delete-all-sessions.command-handler';
import { DeleteAllSessionsTransferDto } from '@lumio/modules/sessions/api/dto/transfer/delete-all-sessions.transfer.dto';

describe('DeleteAllSessionssUseCase', () => {
  let useCase: DeleteAllSessionsCommandHandler;
  let mockRepository: SessionRepository;

  const mockDeleteAllSessionsDto: DeleteAllSessionsTransferDto = {
    userId: 1,
    deviceId: 'current-device-123',
  };

  const mockCurrentSession: SessionEntity = {
    id: 1,
    deviceName: 'Current Device',
    ip: '192.168.1.100',
    userId: 1,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    deletedAt: null,
    expiresAt: new Date('2025-07-01T10:00:00Z'),
    deviceId: 'current-device-123',
    tokenVersion: 1,
    user: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAllSessionsCommandHandler,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            deleteAllSessionsExcludeCurrent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<DeleteAllSessionsCommandHandler>(
      DeleteAllSessionsCommandHandler,
    );
    mockRepository = module.get<SessionRepository>(SessionRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete all sessions except current', async () => {
      // Arrange
      const command = new DeleteAllSessionsCommand(mockDeleteAllSessionsDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(
        mockCurrentSession,
      );
      (
        mockRepository.deleteAllSessionsExcludeCurrent as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        userId: mockDeleteAllSessionsDto.userId,
        deviceId: mockDeleteAllSessionsDto.deviceId,
      });
      expect(
        mockRepository.deleteAllSessionsExcludeCurrent,
      ).toHaveBeenCalledWith({
        userId: mockCurrentSession.userId,
        sessionId: mockCurrentSession.id,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw BadRequestDomainException when current session not found', async () => {
      // Arrange
      const command = new DeleteAllSessionsCommand(mockDeleteAllSessionsDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      // Проверяем, что выбрасывается DomainException (базовый класс)
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      // Проверяем конкретные свойства исключения
      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          "Can't delete all sessions",
        );
        expect(domainException.message).toBe('Bad Request');
      }

      expect(
        mockRepository.deleteAllSessionsExcludeCurrent,
      ).not.toHaveBeenCalled();
    });

    it('should use current date for deletedAt', async () => {
      // Arrange
      const command = new DeleteAllSessionsCommand(mockDeleteAllSessionsDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(
        mockCurrentSession,
      );
      (
        mockRepository.deleteAllSessionsExcludeCurrent as jest.Mock
      ).mockResolvedValue(undefined);
      const before = new Date();

      // Act
      await useCase.execute(command);

      // Assert
      expect(
        mockRepository.deleteAllSessionsExcludeCurrent,
      ).toHaveBeenCalledWith({
        userId: mockCurrentSession.userId,
        sessionId: mockCurrentSession.id,
        deletedAt: expect.any(Date),
      });
      const call = (mockRepository.deleteAllSessionsExcludeCurrent as jest.Mock)
        .mock.calls[0][0];
      expect(call.deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(call.deletedAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });
  });
});
