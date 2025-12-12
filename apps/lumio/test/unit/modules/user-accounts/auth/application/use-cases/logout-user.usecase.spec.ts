import { Test, TestingModule } from '@nestjs/testing';
import {
  LogoutUserUseCase,
  LogoutUserCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/logout-user.usecase';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
  let mockRepository: SessionRepository;

  const userId = 1;
  const deviceId = 'device-123';
  const mockSession: SessionEntity = {
    id: 5,
    deviceName: 'Chrome on Windows',
    ip: '192.168.1.1',
    userId: 1,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    deletedAt: null,
    expiresAt: new Date('2025-07-01T10:00:00Z'),
    deviceId: 'device-123',
    user: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUserUseCase,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            deleteSession: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<LogoutUserUseCase>(LogoutUserUseCase);
    mockRepository = module.get<SessionRepository>(SessionRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete session when valid userId and deviceId provided', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(mockSession);
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        userId: userId,
        deviceId: deviceId,
      });
      expect(mockRepository.deleteSession).toHaveBeenCalledWith({
        userId: mockSession.userId,
        deviceId: mockSession.deviceId,
        sessionId: mockSession.id,
        deletedAt: expect.any(Date),
      });
    });

    it('should return early when userId is missing', async () => {
      // Arrange
      const command = new LogoutUserCommand('', deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).not.toHaveBeenCalled();
      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should return early when deviceId is missing', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), '');
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).not.toHaveBeenCalled();
      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should return early when session not found', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRepository.deleteSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        userId: userId,
        deviceId: deviceId,
      });
      expect(mockRepository.deleteSession).not.toHaveBeenCalled();
    });

    it('should use current date for deletedAt', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(mockSession);
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
