import { Test, TestingModule } from '@nestjs/testing';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  DeleteSessionCommandHandler,
  DeleteSessionCommand,
} from '@lumio/modules/sessions/application/commands/delete-session.command-handler';
import { DeleteSessionTransferDto } from '@lumio/modules/sessions/api/dto/transfer/delete-session.dto';

describe('DeleteSessionCommandHandler', () => {
  let useCase: DeleteSessionCommandHandler;
  let mockRepository: SessionRepository;

  const mockDeleteSessionDto: DeleteSessionTransferDto = {
    userId: 1,
    userDeviceId: 'current-device-123',
    paramDeviceId: 'target-device-456',
  };

  const mockFoundSession: SessionEntity = {
    id: 2,
    deviceName: 'Target Device',
    ip: '192.168.1.200',
    userId: 1,
    createdAt: new Date('2025-01-02T10:00:00Z'),
    deletedAt: null,
    expiresAt: new Date('2025-07-02T10:00:00Z'),
    deviceId: 'target-device-456',
    tokenVersion: 1,
    user: {} as any,
  };

  const mockFoundSessionDifferentUser: SessionEntity = {
    ...mockFoundSession,
    userId: 999, // Different user
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSessionCommandHandler,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            deleteSession: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<DeleteSessionCommandHandler>(
      DeleteSessionCommandHandler,
    );
    mockRepository = module.get<SessionRepository>(SessionRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete session when valid request', async () => {
      // Arrange
      const command = new DeleteSessionCommand(mockDeleteSessionDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(
        mockFoundSession,
      );
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        deviceId: mockDeleteSessionDto.paramDeviceId,
      });
      expect(mockRepository.deleteSession).toHaveBeenCalledWith({
        deviceId: mockDeleteSessionDto.paramDeviceId,
        userId: mockDeleteSessionDto.userId,
        sessionId: mockFoundSession.id,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw NotFoundDomainException when session not found', async () => {
      // Arrange
      const command = new DeleteSessionCommand(mockDeleteSessionDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        // Основное сообщение будет 'Not Found'
        expect(domainException.message).toBe('Not Found');
        // Конкретное сообщение в extensions
        expect(domainException.extensions[0]?.message).toBe(
          'Device is not found',
        );
      }

      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when trying to delete other user session', async () => {
      // Arrange
      const command = new DeleteSessionCommand(mockDeleteSessionDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(
        mockFoundSessionDifferentUser,
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Forbidden');
        expect(domainException.extensions[0]?.message).toBe(
          "You can't terminate someone else's session!",
        );
      }

      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when trying to delete current session', async () => {
      // Arrange
      const command = new DeleteSessionCommand({
        ...mockDeleteSessionDto,
        paramDeviceId: 'current-device-123', // Same as userDeviceId
      });
      (mockRepository.findSession as jest.Mock).mockResolvedValue({
        ...mockFoundSession,
        deviceId: 'current-device-123',
      });

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Forbidden');
        expect(domainException.extensions[0]?.message).toBe(
          "You can't terminate your current session!",
        );
      }

      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should use current date for deletedAt', async () => {
      // Arrange
      const command = new DeleteSessionCommand(mockDeleteSessionDto);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(
        mockFoundSession,
      );
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);
      const before = new Date();

      // Act
      await useCase.execute(command);

      // Assert
      const call = (mockRepository.deleteSession as jest.Mock).mock.calls[0][0];
      expect(call.deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(call.deletedAt.getTime()).toBeLessThanOrEqual(
        new Date().getTime(),
      );
    });
  });
});
