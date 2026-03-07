import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@lumio/modules/user-accounts/auth/api/auth.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response, Request } from 'express';
import { CoreConfig } from '@lumio/core/core.config';
import { JwtAuthGuard } from '@lumio/core/guards/bearer/jwt-auth.guard';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InputRegistrationDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration.input.dto';
import { InputLoginDto } from '@lumio/modules/user-accounts/users/api/dto/input/login.input.dto';
import { InputRegistrationConfirmationDto } from '@lumio/modules/user-accounts/users/api/dto/input/registration-confirmation.input.dto';
import { InputPasswordRecoveryDto } from '@lumio/modules/user-accounts/users/api/dto/input/password-recovery.input.dto';
import { InputNewPasswordDto } from '@lumio/modules/user-accounts/users/api/dto/input/new-password.input.dto';
import { AboutUserOutputDto } from '@lumio/modules/user-accounts/users/api/dto/output/about-user.output.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let coreConfig: jest.Mocked<CoreConfig>;

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    end: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    user: {
      deviceName: 'test-device',
      ip: '127.0.0.1',
      userId: 1,
      deviceId: 'device-123',
    },
    headers: {
      'user-agent': 'Test Agent',
    },
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('localhost:3000'),
  } as unknown as Request;

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
          provide: QueryBus,
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
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RefreshTokenGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard('yandex'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    authController = module.get<AuthController>(AuthController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
    coreConfig = module.get(CoreConfig);
  });

  describe('me', () => {
    it('should return current user info', async () => {
      const userId = 1;
      const expectedResult = new AboutUserOutputDto(
        userId,
        'testuser',
        'test@example.com',
      );

      queryBus.execute.mockResolvedValue(expectedResult);

      const result = await authController.me(userId);

      expect(result).toEqual(expectedResult);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const registrationDto: InputRegistrationDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!',
      };

      commandBus.execute.mockResolvedValue(undefined);

      await authController.register(registrationDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ registerDto: registrationDto }),
      );
    });
  });

  describe('registrationConfirmation', () => {
    it('should confirm registration', async () => {
      const confirmationDto: InputRegistrationConfirmationDto = {
        confirmCode: 'confirmation-code-123',
      };

      commandBus.execute.mockResolvedValue(undefined);

      await authController.registrationConfirmation(confirmationDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ confirmCode: confirmationDto.confirmCode }),
      );
    });
  });

  describe('login', () => {
    it('should login user and return access token', async () => {
      const loginDto: InputLoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const expectedResult = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
      };

      commandBus.execute.mockResolvedValue(expectedResult);
      mockResponse.cookie = jest.fn();

      const result = await authController.login(
        loginDto,
        mockResponse,
        mockRequest,
      );

      expect(result).toEqual({ accessToken: expectedResult.accessToken });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ loginDto: loginDto }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedResult.refreshToken,
        expect.any(Object),
      );
    });
  });

  describe('logout', () => {
    it('should logout user and clear cookie', async () => {
      const userId = 1;
      const deviceId = 'device-123';

      commandBus.execute.mockResolvedValue(undefined);
      mockResponse.clearCookie = jest.fn().mockReturnThis();
      mockResponse.end = jest.fn();

      await authController.logout(userId, deviceId, mockRequest, mockResponse);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId, deviceId }),
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
      const recoveryDto: InputPasswordRecoveryDto = {
        email: 'test@example.com',
        recaptchaToken: 'recaptcha-token',
      };

      commandBus.execute.mockResolvedValue(undefined);

      await authController.passwordRecovery(recoveryDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ passwordRecoveryDto: recoveryDto }),
      );
    });
  });

  describe('newPassword', () => {
    it('should set new password', async () => {
      const newPasswordDto: InputNewPasswordDto = {
        password: 'NewPassword123!',
        recoveryCode: 'recovery-code-123',
      };

      commandBus.execute.mockResolvedValue(undefined);

      await authController.newPassword(newPasswordDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ newPasswordDto: newPasswordDto }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const expectedResult = {
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123',
      };

      commandBus.execute.mockResolvedValue(expectedResult);
      mockResponse.cookie = jest.fn();

      const result = await authController.refreshToken(
        mockRequest,
        mockResponse,
      );

      expect(result).toEqual({ accessToken: expectedResult.accessToken });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceName: 'test-device',
          ip: '127.0.0.1',
          userId: 1,
          deviceId: 'device-123',
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedResult.refreshToken,
        expect.any(Object),
      );
    });
  });

  describe('yandexCallback', () => {
    it('should handle yandex oauth callback', async () => {
      const mockReqWithUser = {
        ...mockRequest,
        user: { id: 1, email: 'yandex@example.com' },
      };
      const expectedResult = {
        accessToken: 'yandex-access-token',
        refreshToken: 'yandex-refresh-token',
      };

      commandBus.execute.mockResolvedValue(expectedResult);
      mockResponse.cookie = jest.fn();
      mockResponse.redirect = jest.fn();

      await authController.yandexCallback(mockReqWithUser, mockResponse);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userYandexDto: mockReqWithUser.user,
          deviceName: expect.any(String),
          ip: expect.any(String),
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expectedResult.refreshToken,
        expect.any(Object),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        `${coreConfig.frontendUrl}/auth/oauth-success?accessToken=${expectedResult.accessToken}`,
      );
    });
  });
});
