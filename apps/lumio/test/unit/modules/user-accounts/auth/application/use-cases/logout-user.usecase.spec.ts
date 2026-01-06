import { Test, TestingModule } from '@nestjs/testing';
import {
  LogoutUserCommandHandler,
  LogoutUserCommand,
} from '@lumio/modules/user-accounts/auth/application/commands/logout-user.command-handler';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { SessionEntity } from '@lumio/modules/sessions/domain/session.entity';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserCommandHandler;
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
    tokenVersion: 1,
    user: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUserCommandHandler,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            updateSession: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<LogoutUserCommandHandler>(LogoutUserCommandHandler);
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
      (mockRepository.updateSession as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        userId: userId,
        deviceId: deviceId,
      });
      expect(mockRepository.updateSession).toHaveBeenCalledWith({
        sessionId: mockSession.id,
        iat: mockSession.createdAt,
        exp: mockSession.expiresAt,
        tokenVersion: mockSession.tokenVersion + 1,
      });
    });

    it('should return early when userId is missing', async () => {
      // Arrange
      const command = new LogoutUserCommand('', deviceId);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).not.toHaveBeenCalled();
      expect(mockRepository.updateSession).not.toHaveBeenCalled();
    });

    it('should return early when deviceId is missing', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), '');

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).not.toHaveBeenCalled();
      expect(mockRepository.updateSession).not.toHaveBeenCalled();
    });

    it('should return early when session not found', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRepository.updateSession as jest.Mock).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRepository.findSession).toHaveBeenCalledWith({
        userId: userId,
        deviceId: deviceId,
      });
      expect(mockRepository.updateSession).not.toHaveBeenCalled();
    });

    it('should increase token version when logging out', async () => {
      // Arrange
      const command = new LogoutUserCommand(userId.toString(), deviceId);
      (mockRepository.findSession as jest.Mock).mockResolvedValue(mockSession);
      (mockRepository.updateSession as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      await useCase.execute(command);

      // Assert
      const call = (mockRepository.updateSession as jest.Mock).mock.calls[0][0];
      expect(call.tokenVersion).toBe(mockSession.tokenVersion + 1);
    });
  });
});
