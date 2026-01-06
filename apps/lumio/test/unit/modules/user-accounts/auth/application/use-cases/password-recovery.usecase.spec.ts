import { Test, TestingModule } from '@nestjs/testing';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  PasswordRecoveryCommandHandler,
  PasswordRecoveryCommand,
} from '@lumio/modules/user-accounts/auth/application/commands/password-recovery.command-handler';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { NodemailerService } from '@lumio/modules/user-accounts/adapters/nodemailer/nodemailer.service';
import { EmailService } from '@lumio/modules/user-accounts/adapters/nodemailer/template/email-examples';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('PasswordRecoveryUseCase', () => {
  let useCase: PasswordRecoveryCommandHandler;
  let mockUserRepository: UserRepository;
  let mockNodemailerService: NodemailerService;
  let mockRecaptchaService: RecaptchaService;
  let mockLoggerService: AppLoggerService;

  const mockPasswordRecoveryDto = {
    email: 'test@example.com',
    recaptchaToken: 'token123',
  };
  const mockUser = {
    id: 1,
    email: 'test@example.com',
  };
  const newConfirmationCode = '123e4567-e89b-12d3-a456-426614174000'; // Хардкодим UUID

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordRecoveryCommandHandler,
        {
          provide: UserRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            updateCodeAndExpirationDate: jest.fn(),
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
            passwordRecovery: jest.fn(),
          },
        },
        {
          provide: RecaptchaService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<PasswordRecoveryCommandHandler>(
      PasswordRecoveryCommandHandler,
    );
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockNodemailerService = module.get<NodemailerService>(NodemailerService);
    mockRecaptchaService = module.get<RecaptchaService>(RecaptchaService);
    mockLoggerService = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should process password recovery successfully', async () => {
      // Arrange
      const command = new PasswordRecoveryCommand(mockPasswordRecoveryDto);

      // Убрали мок UUID

      (mockRecaptchaService.verify as jest.Mock).mockResolvedValue(true);
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.updateCodeAndExpirationDate as jest.Mock
      ).mockResolvedValue(undefined);
      (mockNodemailerService.sendEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      await useCase.execute(command);

      // Assert
      expect(mockRecaptchaService.verify).toHaveBeenCalledWith(
        mockPasswordRecoveryDto.recaptchaToken,
      );
      expect(mockUserRepository.findUserByEmail).toHaveBeenCalledWith(
        mockPasswordRecoveryDto.email,
      );
      expect(
        mockUserRepository.updateCodeAndExpirationDate,
      ).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String), // newConfirmationCode будет реальный UUID
        expect.any(Date),
      );
      expect(mockNodemailerService.sendEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String), // реальный UUID
        expect.any(Function),
      );
    });

    it('should throw ForbiddenDomainException when reCAPTCHA verification fails', async () => {
      // Arrange
      const command = new PasswordRecoveryCommand(mockPasswordRecoveryDto);

      // Mock randomUUID - добавлено
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue(newConfirmationCode as any);

      (mockRecaptchaService.verify as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        throw new Error('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        // Основное сообщение
        expect(domainException.message).toBe('Forbidden');
        // Конкретное сообщение в extensions
        expect(domainException.extensions[0]?.message).toBe(
          'reCAPTCHA verification failed',
        );
      }

      expect(mockUserRepository.findUserByEmail).not.toHaveBeenCalled();
      expect(mockNodemailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenDomainException when user does not exist', async () => {
      // Arrange
      const command = new PasswordRecoveryCommand(mockPasswordRecoveryDto);

      // Mock randomUUID - добавлено
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue(newConfirmationCode as any);

      (mockRecaptchaService.verify as jest.Mock).mockResolvedValue(true);
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(DomainException);

      try {
        await useCase.execute(command);
        throw new Error('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.message).toBe('Forbidden');
        expect(domainException.extensions[0]?.message).toBe(
          'User does not exist',
        );
      }

      expect(
        mockUserRepository.updateCodeAndExpirationDate,
      ).not.toHaveBeenCalled();
      expect(mockNodemailerService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle email sending error gracefully', async () => {
      // Arrange
      const command = new PasswordRecoveryCommand(mockPasswordRecoveryDto);

      // Mock randomUUID - добавлено
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue(newConfirmationCode as any);

      (mockRecaptchaService.verify as jest.Mock).mockResolvedValue(true);
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (
        mockUserRepository.updateCodeAndExpirationDate as jest.Mock
      ).mockResolvedValue(undefined);
      (mockNodemailerService.sendEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP error'),
      );

      // Act & Assert - should not throw because error is caught inside useCase
      await expect(useCase.execute(command)).resolves.not.toThrow();
      expect(mockNodemailerService.sendEmail).toHaveBeenCalled();

      // Проверяем, что loggerService.error был вызван
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Ошибка отправки email:Error: SMTP error'),
        expect.any(String),
        'NodemailerService',
      );
    });
  });
});
