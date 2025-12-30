import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  LoginUserUseCase,
  LoginUserCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/login-user.usecase';
import { AuthService } from '@lumio/modules/user-accounts/auth/application/auth.service';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockAuthService: AuthService;
  let mockSessionRepository: SessionRepository;
  let mockAccessTokenJwtService: JwtService;
  let mockRefreshTokenJwtService: JwtService;

  const mockLoginDto = {
    email: 'test@example.com',
    password: 'Password123',
  };
  const deviceName = 'Chrome on Windows';
  const ip = '192.168.1.1';
  const userId = 1;
  const mockUser = {
    id: userId,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date(),
    deletedAt: null,
  };
  const deviceId = randomUUID();
  const mockExistSession = {
    id: 5,
    userId,
    deviceId,
    deviceName,
    ip: '192.168.1.1',
    tokenVersion: 1,
    deletedAt: null,
    createdAt: new Date(),
    expiresAt: new Date(),
  };
  const mockRefreshToken = 'refresh-token';
  const mockAccessToken = 'access-token';
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserUseCase,
        {
          provide: AuthService,
          useValue: {
            checkUserCredentials: jest.fn(),
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            updateSession: jest.fn(),
            createSession: jest.fn(),
          },
        },
        {
          provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<LoginUserUseCase>(LoginUserUseCase);
    mockAuthService = module.get<AuthService>(AuthService);
    mockSessionRepository = module.get<SessionRepository>(SessionRepository);
    mockAccessTokenJwtService = module.get(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN);
    mockRefreshTokenJwtService = module.get(
      REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should login successfully with new session', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      (mockAuthService.checkUserCredentials as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue({
        iat,
        exp,
      });
      (mockAccessTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockAccessToken,
      );
      (mockSessionRepository.createSession as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockAuthService.checkUserCredentials).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
      expect(mockSessionRepository.findSession).toHaveBeenCalledWith({
        userId,
        deviceName,
      });
      expect(mockRefreshTokenJwtService.sign).toHaveBeenCalledWith({
        userId,
        deviceId: expect.any(String),
        deviceName,
        ip,
      });
      expect(mockRefreshTokenJwtService.verify).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(mockSessionRepository.createSession).toHaveBeenCalledWith({
        userId,
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
        deviceId: expect.any(String),
        ip,
        deviceName,
      });
      expect(mockAccessTokenJwtService.sign).toHaveBeenCalledWith({
        userId,
        deviceId: expect.any(String),
        tokenVersion: 1,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should login successfully with existing session', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      (mockAuthService.checkUserCredentials as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockExistSession,
      );
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue({
        iat,
        exp,
      });
      (mockAccessTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockAccessToken,
      );
      (mockSessionRepository.updateSession as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(mockSessionRepository.findSession).toHaveBeenCalledWith({
        userId,
        deviceName,
      });
      expect(mockRefreshTokenJwtService.sign).toHaveBeenCalledWith({
        userId,
        deviceId: mockExistSession.deviceId,
        deviceName,
        ip,
      });
      expect(mockSessionRepository.updateSession).toHaveBeenCalledWith({
        sessionId: mockExistSession.id,
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
        tokenVersion: expect.any(Number),
      });
      expect(mockSessionRepository.createSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw ForbiddenDomainException when refresh token verification fails', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      (mockAuthService.checkUserCredentials as jest.Mock).mockResolvedValue(
        mockUser,
      );
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(null);
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue({}); // missing iat, exp

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
          'Refresh token is not verified',
        );
      }

      expect(mockSessionRepository.createSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database connection error when checking user credentials', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      const dbError = new Error('Database connection failed');
      jest
        .spyOn(mockAuthService, 'checkUserCredentials')
        .mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockSessionRepository.findSession).not.toHaveBeenCalled();
      expect(mockRefreshTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database error when finding existing session', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      const dbError = new Error('Session table not found');
      jest
        .spyOn(mockAuthService, 'checkUserCredentials')
        .mockResolvedValue(mockUser);
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockRefreshTokenJwtService.sign).not.toHaveBeenCalled();
      expect(mockSessionRepository.createSession).not.toHaveBeenCalled();
    });

    it('should handle database error when creating new session', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      const dbError = new Error('Cannot insert into sessions table');
      jest
        .spyOn(mockAuthService, 'checkUserCredentials')
        .mockResolvedValue(mockUser);
      jest.spyOn(mockSessionRepository, 'findSession').mockResolvedValue(null);
      jest
        .spyOn(mockRefreshTokenJwtService, 'sign')
        .mockReturnValue(mockRefreshToken);
      jest.spyOn(mockRefreshTokenJwtService, 'verify').mockReturnValue({
        iat,
        exp,
      });
      jest
        .spyOn(mockSessionRepository, 'createSession')
        .mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database error when updating existing session', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      const dbError = new Error('Cannot update session');
      jest
        .spyOn(mockAuthService, 'checkUserCredentials')
        .mockResolvedValue(mockUser);
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockResolvedValue(mockExistSession);
      jest
        .spyOn(mockRefreshTokenJwtService, 'sign')
        .mockReturnValue(mockRefreshToken);
      jest.spyOn(mockRefreshTokenJwtService, 'verify').mockReturnValue({
        iat,
        exp,
      });
      jest
        .spyOn(mockSessionRepository, 'updateSession')
        .mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT signing error', async () => {
      // Arrange
      const command = new LoginUserCommand(mockLoginDto, deviceName, ip);
      const jwtError = new Error('JWT signing failed');
      jest
        .spyOn(mockAuthService, 'checkUserCredentials')
        .mockResolvedValue(mockUser);
      jest.spyOn(mockSessionRepository, 'findSession').mockResolvedValue(null);
      jest
        .spyOn(mockRefreshTokenJwtService, 'sign')
        .mockReturnValue(mockRefreshToken);
      jest.spyOn(mockRefreshTokenJwtService, 'verify').mockReturnValue({
        iat,
        exp,
      });
      jest
        .spyOn(mockSessionRepository, 'createSession')
        .mockResolvedValue(undefined);
      jest.spyOn(mockAccessTokenJwtService, 'sign').mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(jwtError);
    });
  });
});
