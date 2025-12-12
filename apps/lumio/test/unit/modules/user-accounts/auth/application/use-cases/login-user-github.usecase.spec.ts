import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  LoginUserGitHubUseCase,
  LoginUserGitHubCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/login-user-github.usecase';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import { UserRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.repository';
import { CryptoService } from '@lumio/modules/user-accounts/adapters/crypto.service';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';

describe('LoginUserGitHubUseCase', () => {
  let useCase: LoginUserGitHubUseCase;
  let mockSessionRepository: SessionRepository;
  let mockUserRepository: UserRepository;
  let mockCryptoService: CryptoService;
  let mockAccessTokenJwtService: JwtService;
  let mockRefreshTokenJwtService: JwtService;

  const mockGitHubDto = {
    gitId: 'github-123',
    email: 'github@example.com',
    username: 'githubuser',
  };
  const deviceName = 'Chrome on Windows';
  const ip = '192.168.1.1';
  const mockExistingUser = {
    id: 1,
    email: 'github@example.com',
    username: 'githubuser',
  };
  const mockGitHubRecord = {
    id: 10,
    gitId: 'github-123',
    email: 'github@example.com',
    username: 'githubuser',
    userId: 1,
  };
  const deviceId = '123e4567-e89b-12d3-a456-426614174000'; // Хардкодим UUID
  const mockExistSession = {
    id: 5,
    userId: 1,
    deviceId,
    deviceName,
    ip: '192.168.1.1',
  };
  const mockRefreshToken = 'refresh-token';
  const mockAccessToken = 'access-token';
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUserGitHubUseCase,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            updateSession: jest.fn(),
            createSession: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findGitHubByGitId: jest.fn(),
            findUserByEmail: jest.fn(),
            findUserById: jest.fn(),
            createUser: jest.fn(),
            createGitHub: jest.fn(),
            updateGitHub: jest.fn(),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            createPasswordHash: jest.fn(),
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

    useCase = module.get<LoginUserGitHubUseCase>(LoginUserGitHubUseCase);
    mockSessionRepository = module.get<SessionRepository>(SessionRepository);
    mockUserRepository = module.get<UserRepository>(UserRepository);
    mockCryptoService = module.get<CryptoService>(CryptoService);
    mockAccessTokenJwtService = module.get(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN);
    mockRefreshTokenJwtService = module.get(
      REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create new user and GitHub record when neither exists', async () => {
      // Arrange
      const command = new LoginUserGitHubCommand(mockGitHubDto, deviceName, ip);

      // Вместо мока - просто проверяем, что UUID используется, но не мокаем его
      // deviceId уже хардкожен выше

      (mockUserRepository.findGitHubByGitId as jest.Mock).mockResolvedValue(
        null,
      );
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        'hashed-password',
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue({ id: 2 });
      (mockUserRepository.createGitHub as jest.Mock).mockResolvedValue(
        undefined,
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
      expect(mockUserRepository.findGitHubByGitId).toHaveBeenCalledWith(
        mockGitHubDto.gitId,
      );
      expect(mockUserRepository.findUserByEmail).toHaveBeenCalledWith(
        mockGitHubDto.email,
      );
      expect(mockCryptoService.createPasswordHash).toHaveBeenCalled();
      expect(mockUserRepository.createUser).toHaveBeenCalled();
      expect(mockUserRepository.createGitHub).toHaveBeenCalledWith({
        gitId: mockGitHubDto.gitId,
        email: mockGitHubDto.email,
        username: mockGitHubDto.username,
        userId: 2,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should link existing GitHub record to user when GitHub exists but user does not', async () => {
      // Arrange
      const command = new LoginUserGitHubCommand(mockGitHubDto, deviceName, ip);

      (mockUserRepository.findGitHubByGitId as jest.Mock).mockResolvedValue(
        mockGitHubRecord,
      );
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.findUserById as jest.Mock).mockResolvedValue(
        mockExistingUser,
      );
      (mockUserRepository.updateGitHub as jest.Mock).mockResolvedValue(
        undefined,
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
      expect(mockUserRepository.findGitHubByGitId).toHaveBeenCalledWith(
        mockGitHubDto.gitId,
      );
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(
        mockGitHubRecord.userId,
      );
      expect(mockUserRepository.updateGitHub).toHaveBeenCalledWith(
        mockGitHubRecord.id,
        {
          userId: mockExistingUser.id,
          email: mockGitHubDto.email,
          username: mockGitHubDto.username,
        },
      );
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should create GitHub record when user exists but GitHub does not', async () => {
      // Arrange
      const command = new LoginUserGitHubCommand(mockGitHubDto, deviceName, ip);

      // Мокаем randomUUID для этого конкретного теста
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(deviceId as any);

      (mockUserRepository.findGitHubByGitId as jest.Mock).mockResolvedValue(
        null,
      );
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(
        mockExistingUser,
      );
      (mockUserRepository.createGitHub as jest.Mock).mockResolvedValue(
        undefined,
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
      expect(mockUserRepository.createGitHub).toHaveBeenCalledWith({
        gitId: mockGitHubDto.gitId,
        email: mockGitHubDto.email,
        username: mockGitHubDto.username,
        userId: mockExistingUser.id,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should use existing user and GitHub when both exist', async () => {
      // Arrange
      const command = new LoginUserGitHubCommand(mockGitHubDto, deviceName, ip);

      (mockUserRepository.findGitHubByGitId as jest.Mock).mockResolvedValue(
        mockGitHubRecord,
      );
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(
        mockExistingUser,
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
      expect(mockUserRepository.createUser).not.toHaveBeenCalled();
      expect(mockUserRepository.createGitHub).not.toHaveBeenCalled();
      expect(mockUserRepository.updateGitHub).not.toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw ForbiddenDomainException when refresh token verification fails', async () => {
      // Arrange
      const command = new LoginUserGitHubCommand(mockGitHubDto, deviceName, ip);

      // Мокаем randomUUID для этого теста
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(deviceId as any);

      (mockUserRepository.findGitHubByGitId as jest.Mock).mockResolvedValue(
        null,
      );
      (mockUserRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (mockCryptoService.createPasswordHash as jest.Mock).mockResolvedValue(
        'hashed-password',
      );
      (mockUserRepository.createUser as jest.Mock).mockResolvedValue({ id: 2 });
      (mockUserRepository.createGitHub as jest.Mock).mockResolvedValue(
        undefined,
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
        fail('Should have thrown an exception');
      } catch (error) {
        const domainException = error as DomainException;
        // Основное сообщение
        expect(domainException.message).toBe('Forbidden');
        // Конкретное сообщение в extensions
        expect(domainException.extensions[0]?.message).toBe(
          'Refresh token not verified',
        );
      }

      expect(mockSessionRepository.createSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
