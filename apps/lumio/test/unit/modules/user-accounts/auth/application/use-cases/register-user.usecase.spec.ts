import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  RegisterUserUseCase,
  RegisterUserCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/register-user.usecase';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { EmailService } from '@lumio/modules/user-accounts/adapters/nodemailer/template/email-examples';
import { CreateUserCommand } from '@lumio/modules/user-accounts/users/application/use-cases/create-user.use-case';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockUserRepository: UserRepository;
  let mockNodemailerService: NodemailerService;
  let mockCommandBus: CommandBus;
  let mockLoggerService: AppLoggerService;

  const mockRegisterDto = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123',
  };

  const mockUser = {
    id: 1,
    username: 'existinguser',
    email: 'existing@example.com',
  };

  const mockEmailConfirmation = {
    id: 1,
    userId: 100,
    confirmationCode: '123456',
    isConfirmed: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            doesExistByUsernameOrEmail: jest.fn(),
            findByCodeOrIdEmailConfirmation: jest.fn(),
          },
        },
        {
          provide: NodemailerService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            registrationEmail: jest.fn(),
          },
        },
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<RegisterUserUseCase>(RegisterUserUseCase);
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockNodemailerService = module.get<NodemailerService>(NodemailerService);
    mockCommandBus = module.get<CommandBus>(CommandBus);
    mockLoggerService = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should register user successfully and send confirmation email', async () => {
      // Arrange
      const command = new RegisterUserCommand(mockRegisterDto);
      (
        mockUserRepository.doesExistByUsernameOrEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(100);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockEmailConfirmation);
      (mockNodemailerService.sendEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(
        mockUserRepository.doesExistByUsernameOrEmail,
      ).toHaveBeenCalledWith(mockRegisterDto.username, mockRegisterDto.email);
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CreateUserCommand({ ...mockRegisterDto }),
      );
      expect(
        mockUserRepository.findByCodeOrIdEmailConfirmation,
      ).toHaveBeenCalledWith({
        userId: 100,
      });
      expect(mockNodemailerService.sendEmail).toHaveBeenCalledWith(
        mockRegisterDto.email,
        mockEmailConfirmation.confirmationCode,
        expect.any(Function),
      );
    });

    it('should throw BadRequestDomainException when username already exists', async () => {
      // Arrange
      const command = new RegisterUserCommand(mockRegisterDto);
      (
        mockUserRepository.doesExistByUsernameOrEmail as jest.Mock
      ).mockResolvedValue({
        ...mockUser,
        username: mockRegisterDto.username,
      });

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
          'User with this username is already registered',
        );
      }

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(mockNodemailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when email already exists', async () => {
      // Arrange
      const command = new RegisterUserCommand(mockRegisterDto);
      (
        mockUserRepository.doesExistByUsernameOrEmail as jest.Mock
      ).mockResolvedValue({
        ...mockUser,
        email: mockRegisterDto.email,
      });

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Bad Request');
        expect(domainException.extensions[0]?.message).toBe(
          'User with this email is already registered',
        );
      }

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(mockNodemailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when email confirmation not found', async () => {
      // Arrange
      const command = new RegisterUserCommand(mockRegisterDto);
      (
        mockUserRepository.doesExistByUsernameOrEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(100);
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
          'Email confirmation not found',
        );
      }

      expect(mockNodemailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending error gracefully (catch block)', async () => {
      // Arrange
      const command = new RegisterUserCommand(mockRegisterDto);
      (
        mockUserRepository.doesExistByUsernameOrEmail as jest.Mock
      ).mockResolvedValue(null);
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(100);
      (
        mockUserRepository.findByCodeOrIdEmailConfirmation as jest.Mock
      ).mockResolvedValue(mockEmailConfirmation);
      (mockNodemailerService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP error'),
      );

      // Act & Assert - should not throw because error is caught inside useCase
      await expect(useCase.execute(command)).resolves.not.toThrow();
      expect(mockNodemailerService.sendEmail).toHaveBeenCalled();

      // Проверяем, что loggerService.error был вызван
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Ошибка отправки email: SMTP error`,
        expect.any(String),
        'RegisterUserUseCase',
      );
    });
  });
});
