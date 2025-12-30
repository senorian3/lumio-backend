import { Test, TestingModule } from '@nestjs/testing';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  RegistrationConfirmationUserUseCase,
  RegistrationConfirmationUserCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/registration-confirmation.usecase';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';

describe('RegistrationConfirmationUserUseCase', () => {
  let useCase: RegistrationConfirmationUserUseCase;
  let mockUserRepository: UserRepository;

  const mockConfirmCode = 'abc123';
  const mockUserEmailConfirmation = {
    id: 1,
    userId: 100,
    confirmationCode: 'abc123',
    isConfirmed: false,
    expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  const mockExpiredUserEmailConfirmation = {
    ...mockUserEmailConfirmation,
    expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  };
  const mockAlreadyConfirmedUserEmailConfirmation = {
    ...mockUserEmailConfirmation,
    isConfirmed: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationConfirmationUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            findByCodeOrIdEmailConfirmation: jest.fn(),
            confirmEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RegistrationConfirmationUserUseCase>(
      RegistrationConfirmationUserUseCase,
    );
    mockUserRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should confirm email when valid code provided', async () => {
      // Arrange
      const command = new RegistrationConfirmationUserCommand(mockConfirmCode);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockUserEmailConfirmation);
      (mockUserRepository.confirmEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(
        mockUserRepository.findByCodeOrIdEmailConfirmation,
      ).toHaveBeenCalledWith({
        code: mockConfirmCode,
      });
      expect(mockUserRepository.confirmEmail).toHaveBeenCalledWith(
        mockUserEmailConfirmation.userId,
      );
    });

    it('should throw BadRequestDomainException when confirmation code not found', async () => {
      // Arrange
      const command = new RegistrationConfirmationUserCommand(mockConfirmCode);
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
        expect(domainException.message).toBe('Bad Request');
        expect(domainException.extensions[0]?.message).toBe(
          'Confirmation code not found',
        );
        expect(domainException.extensions[0]?.field).toBe('confirmationCode');
      }

      expect(mockUserRepository.confirmEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when confirmation code already used', async () => {
      // Arrange
      const command = new RegistrationConfirmationUserCommand(mockConfirmCode);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockAlreadyConfirmedUserEmailConfirmation);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Bad Request');
        expect(domainException.extensions[0]?.message).toBe(
          'Confirmation code already used',
        );
        expect(domainException.extensions[0]?.field).toBe('confirmationCode');
      }

      expect(mockUserRepository.confirmEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when confirmation code expired', async () => {
      // Arrange
      const command = new RegistrationConfirmationUserCommand(mockConfirmCode);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockExpiredUserEmailConfirmation);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Bad Request');
        expect(domainException.extensions[0]?.message).toBe(
          'Confirmation code expired',
        );
        expect(domainException.extensions[0]?.field).toBe('confirmationCode');
      }

      expect(mockUserRepository.confirmEmail).not.toHaveBeenCalled();
    });
  });
});
