import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { AuthController } from '@lumio/modules/user-accounts/auth/api/auth.controller';
import { CoreConfig } from '@lumio/core/core.config';
import { InputRegistrationDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration.input-dto';
import { InputLoginDto } from '@lumio/modules/user-accounts/users/api/dto/input/login.input-dto';
import { InputPasswordRecoveryDto } from '@lumio/modules/user-accounts/users/api/dto/input/password-recovery.input-dto';
import { InputNewPasswordDto } from '@lumio/modules/user-accounts/users/api/dto/input/new-password.input-dto';
import { RegistrationConfirmationInputDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration-confirmation.input-dto';
import { RegisterUserCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/register-user.usecase';
import { LoginUserCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user.usecase';
import { LogoutUserCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/logout-user.usecase';
import { PasswordRecoveryCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/password-recovery.usecase';
import { NewPasswordCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/new-password.usecase';
import { LoginUserGitHubCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-github.usecase';
import { LoginUserGoogleCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-google.usecase';
import { RegistrationConfirmationUserCommand } from '@lumio/modules/user-accounts/auth/application/use-cases/registration-confirmation.usecase';
import { AboutUserUserQuery } from '@lumio/modules/user-accounts/auth/application/query/about-user.query-handler';
import { AboutUserOutputDto } from '@lumio/modules/user-accounts/users/api/dto/output/about-user.output-dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockCommandBus: CommandBus;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
    end: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockRequest = {
    socket: { remoteAddress: '192.168.1.1' },
    headers: {
      'user-agent': 'Test Agent',
      'x-forwarded-for': '192.168.1.2',
      host: 'localhost:3000',
    },
    user: {
      userId: '1',
      deviceId: 'device-123',
    },
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'host') return 'localhost:3000';
      return null;
    }),
  } as any;

  let mockQueryBus: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CoreConfig,
          useValue: {
            frontendUrl: 'http://localhost:3000',
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RefreshTokenGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('github'))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('google'))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('yandex'))
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    mockCommandBus = module.get<CommandBus>(CommandBus);
    mockQueryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const dto: InputRegistrationDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.register(dto);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new RegisterUserCommand(dto),
      );
    });
  });

  describe('login', () => {
    it('should login user and set refresh token cookie', async () => {
      // Arrange
      const dto: InputLoginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };
      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(dto, mockResponse, mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new LoginUserCommand(dto, 'Test Agent', '192.168.1.1'),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        },
      );
      expect(result).toEqual({ accessToken: 'access-token' });
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      // Arrange
      const mockResponse = {
        clearCookie: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        end: jest.fn(),
      } as unknown as Response;

      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.logout(mockRequest, mockResponse);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new LogoutUserCommand(
          mockRequest.user.userId,
          mockRequest.user.deviceId,
        ),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('passwordRecovery', () => {
    it('should initiate password recovery', async () => {
      // Arrange
      const dto: InputPasswordRecoveryDto = {
        email: 'test@example.com',
        recaptchaToken: 'recaptcha-token',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.passwordRecovery(dto);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new PasswordRecoveryCommand(dto),
      );
    });
  });

  describe('newPassword', () => {
    it('should set new password', async () => {
      // Arrange
      const dto: InputNewPasswordDto = {
        recoveryCode: 'recovery-code',
        password: 'NewPassword123',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.newPassword(dto);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new NewPasswordCommand(dto),
      );
    });
  });

  describe('githubCallback', () => {
    it('should handle GitHub OAuth callback', async () => {
      // Arrange
      const mockGitHubRequest = {
        socket: { remoteAddress: '192.168.1.3' },
        headers: {
          'user-agent': 'OAuth Agent',
          host: 'localhost:3000',
        },
        user: {
          gitId: 'github-123',
          email: 'github@example.com',
          username: 'githubuser',
        },
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'host') return 'localhost:3000';
          return null;
        }),
      } as any;
      const expectedResult = {
        accessToken: 'github-access-token',
        refreshToken: 'github-refresh-token',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      await controller.githubCallback(mockGitHubRequest, mockResponse);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new LoginUserGitHubCommand(
          mockGitHubRequest.user,
          'OAuth Agent',
          '192.168.1.3',
        ),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'github-refresh-token',
        expect.any(Object), // getOAuthCookieOptions возвращает объект
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-success?accessToken=github-access-token',
      );
    });
  });

  describe('googleCallback', () => {
    it('should handle Google OAuth callback', async () => {
      // Arrange
      const mockGoogleRequest = {
        socket: { remoteAddress: '192.168.1.4' },
        headers: {
          'user-agent': 'OAuth Agent',
          host: 'localhost:3000',
        },
        user: {
          googleId: 'google-123',
          email: 'google@example.com',
          username: 'googleuser',
        },
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'host') return 'localhost:3000';
          return null;
        }),
      } as any;
      const expectedResult = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(expectedResult);

      // Act
      await controller.googleCallback(mockGoogleRequest, mockResponse);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new LoginUserGoogleCommand(
          mockGoogleRequest.user,
          'OAuth Agent',
          '192.168.1.4',
        ),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'google-refresh-token',
        expect.any(Object),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/oauth-success?accessToken=google-access-token',
      );
    });
  });

  describe('registrationConfirmation', () => {
    it('should confirm registration', async () => {
      // Arrange
      const dto: RegistrationConfirmationInputDto = {
        confirmCode: 'confirmation-code',
      };
      (mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined);

      // Act
      await controller.registrationConfirmation(dto);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new RegistrationConfirmationUserCommand(dto.confirmCode),
      );
    });
  });

  describe('me', () => {
    it('should return current user information', async () => {
      // Arrange
      const mockUserRequest = {
        user: {
          userId: 1,
          deviceId: 'device-123',
        },
      } as any;

      const expectedUserInfo: AboutUserOutputDto = new AboutUserOutputDto(
        1,
        'testuser',
        'test@example.com',
      );

      (mockQueryBus.execute as jest.Mock).mockResolvedValue(expectedUserInfo);

      // Act
      const result = await controller.me(mockUserRequest);

      // Assert
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        new AboutUserUserQuery(1),
      );
      expect(result).toEqual(expectedUserInfo);
    });
  });
});
