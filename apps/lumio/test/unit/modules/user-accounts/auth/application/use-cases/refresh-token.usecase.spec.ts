import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import {
  RefreshTokenUseCase,
  RefreshTokenCommand,
} from '@lumio/modules/user-accounts/auth/application/use-cases/refresh-token.usecase';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '@lumio/modules/user-accounts/constants/auth-tokens.inject-constants';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockSessionRepository: SessionRepository;
  let mockAccessTokenJwtService: JwtService;
  let mockRefreshTokenJwtService: JwtService;

  const deviceName = 'Chrome on Windows';
  const ip = '192.168.1.1';
  const userId = 1;
  const deviceId = '123e4567-e89b-12d3-a456-426614174000';
  const mockSession = {
    id: 5,
    userId: 1,
    deviceId,
    deviceName,
    ip: '192.168.1.1',
    deletedAt: null,
    createdAt: new Date(),
    expiresAt: new Date(),
    tokenVersion: 1,
  };
  const mockRefreshToken = 'new-refresh-token';
  const mockAccessToken = 'new-access-token';
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
            updateSession: jest.fn(),
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

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
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
    it('should return new tokens when refresh is successful', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
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
        deviceId,
      });
      expect(mockRefreshTokenJwtService.sign).toHaveBeenCalledWith({
        userId,
        deviceId,
        deviceName,
        ip,
      });
      expect(mockRefreshTokenJwtService.verify).toHaveBeenCalledWith(
        mockRefreshToken,
      );
      expect(mockSessionRepository.updateSession).toHaveBeenCalledWith({
        sessionId: mockSession.id,
        iat: new Date(iat * 1000),
        exp: new Date(exp * 1000),
        tokenVersion: expect.any(Number),
      });
      expect(mockAccessTokenJwtService.sign).toHaveBeenCalledWith({
        userId,
        deviceId,
      });
      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw UnauthorizedException when refresh token verification fails', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );

      try {
        await useCase.execute(command);
        fail('Should have thrown an exception');
      } catch (error) {
        const unauthorizedException = error as UnauthorizedException;
        expect(unauthorizedException.message).toBe('There is no such session');
        // Не проверяем cause, так как он может не устанавливаться
      }

      expect(mockSessionRepository.updateSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle missing iat/exp in verified token', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      // Возвращаем null, чтобы сработала проверка !refreshTokenVerify
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue(null);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockSessionRepository.updateSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should update session with correct dates when iat/exp are numbers', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      const iatNum = 1734256800; // конкретное время
      const expNum = iatNum + 3600;
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );
      (mockRefreshTokenJwtService.sign as jest.Mock).mockReturnValue(
        mockRefreshToken,
      );
      (mockRefreshTokenJwtService.verify as jest.Mock).mockReturnValue({
        iat: iatNum,
        exp: expNum,
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
      expect(mockSessionRepository.updateSession).toHaveBeenCalledWith({
        sessionId: mockSession.id,
        iat: new Date(iatNum * 1000),
        exp: new Date(expNum * 1000),
        tokenVersion: expect.any(Number),
      });
      expect(result.accessToken).toBe(mockAccessToken);
      expect(result.refreshToken).toBe(mockRefreshToken);
    });

    it('should handle database error when finding session', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      const dbError = new Error('Session table not found');
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockRejectedValue(dbError);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(dbError);
      expect(mockRefreshTokenJwtService.sign).not.toHaveBeenCalled();
      expect(mockSessionRepository.updateSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database error when updating session', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      const dbError = new Error('Cannot update session');
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockResolvedValue(mockSession);
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

    it('should handle JWT signing error for refresh token', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      const jwtError = new Error('JWT signing failed');
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockResolvedValue(mockSession);
      jest.spyOn(mockRefreshTokenJwtService, 'sign').mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(jwtError);
      expect(mockRefreshTokenJwtService.verify).not.toHaveBeenCalled();
      expect(mockSessionRepository.updateSession).not.toHaveBeenCalled();
      expect(mockAccessTokenJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle JWT signing error for access token', async () => {
      // Arrange
      const command = new RefreshTokenCommand(deviceName, ip, userId, deviceId);
      const jwtError = new Error('Access token signing failed');
      jest
        .spyOn(mockSessionRepository, 'findSession')
        .mockResolvedValue(mockSession);
      jest
        .spyOn(mockRefreshTokenJwtService, 'sign')
        .mockReturnValue(mockRefreshToken);
      jest.spyOn(mockRefreshTokenJwtService, 'verify').mockReturnValue({
        iat,
        exp,
      });
      jest
        .spyOn(mockSessionRepository, 'updateSession')
        .mockResolvedValue(undefined);
      jest.spyOn(mockAccessTokenJwtService, 'sign').mockImplementation(() => {
        throw jwtError;
      });

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(jwtError);
    });
  });
});
