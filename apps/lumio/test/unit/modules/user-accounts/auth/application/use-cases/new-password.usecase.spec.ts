import { Test, TestingModule } from '@nestjs/testing';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  NewPasswordUseCase,
  NewPasswordCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/new-password.usecase';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';

describe('NewPasswordUseCase', () => {
  let useCase: NewPasswordUseCase;
  let mockUserRepository: UserRepository;
  let mockCryptoService: CryptoService;
  let mockSessionRepository: SessionRepository;

  const mockNewPasswordDto = {
    recoveryCode: 'recovery-code-123',
    password: 'NewPassword123',
  };
  const mockEmailConfirmation = {
    id: 1,
    userId: 100,
    confirmationCode: 'recovery-code-123',
    isConfirmed: false,
    expirationDate: new Date().toISOString(),
  };
  const newPasswordHash = 'hashed-password';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewPasswordUseCase,
        {
          provide: UserRepository,
          useValue: {
            findByCodeOrIdEmailConfirmation: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            createPasswordHash: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            deleteAllSessionsForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<NewPasswordUseCase>(NewPasswordUseCase);
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockCryptoService = module.get<CryptoService>(CryptoService);
    mockSessionRepository = module.get<SessionRepository>(SessionRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update password and delete all sessions for user', async () => {
      // Arrange
      const command = new NewPasswordCommand(mockNewPasswordDto);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockEmailConfirmation);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        newPasswordHash,
      );
      (mockUserRepository.updatePassword as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        mockSessionRepository.deleteAllSessionsForUser as jest.Mock
      ).mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(
        mockUserRepository.findByCodeOrIdEmailConfirmation,
      ).toHaveBeenCalledWith({
        code: mockNewPasswordDto.recoveryCode,
      });
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalledWith(
        mockNewPasswordDto.password,
      );
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        mockEmailConfirmation.userId,
        newPasswordHash,
      );
      expect(
        mockSessionRepository.deleteAllSessionsForUser,
      ).toHaveBeenCalledWith(mockEmailConfirmation.userId);
    });

    it('should throw BadRequestDomainException when email confirmation not found', async () => {
      // Arrange
      const command = new NewPasswordCommand(mockNewPasswordDto);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        // Основное сообщение
        expect(domainException.message).toBe('Bad Request');
        // Конкретное сообщение в extensions
        expect(domainException.extensions[0]?.message).toBe(
          'User does not exist',
        );
      }

      expect(mockCryptoService.createPasswordHash).not.toHaveBeenCalled();
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
      expect(
        mockSessionRepository.deleteAllSessionsForUser,
      ).not.toHaveBeenCalled();
    });
  });
});
