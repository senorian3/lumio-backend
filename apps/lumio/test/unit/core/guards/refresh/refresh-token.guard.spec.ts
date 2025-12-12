import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext } from '@nestjs/common';
import { DomainException } from '@libs/core/exceptions/domain-exceptions';
import { RefreshTokenGuard } from '@lumio/core/guards/refresh/refresh-token.guard';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';
import { SessionRepository } from '@lumio/modules/sessions/domain/infrastructure/session.repository';

describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let mockJwtService: JwtService;
  let mockSessionRepository: SessionRepository;

  const mockExecutionContext = (cookies: any) => {
    const mockRequest = {
      cookies,
      user: null,
    };

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getRequest: () => mockRequest,
    } as unknown as ExecutionContext & { getRequest: () => any };
  };

  const mockSession = {
    userId: 1,
    deviceId: 'device-123',
    expiresAt: new Date('2025-12-31T23:59:59.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: UserAccountsConfig,
          useValue: {
            refreshTokenSecret: 'refresh-secret',
          },
        },
        {
          provide: SessionRepository,
          useValue: {
            findSession: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
    mockJwtService = module.get<JwtService>(JwtService);
    mockSessionRepository = module.get<SessionRepository>(SessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true and set user payload when token is valid and session matches', async () => {
      // Arrange
      const cookies = { refreshToken: 'valid-refresh-token' };
      const context = mockExecutionContext(cookies);
      const request = (context as any).getRequest();

      const expTimestamp = Math.floor(mockSession.expiresAt.getTime() / 1000);

      const payload = {
        userId: 1,
        deviceId: 'device-123',
        exp: expTimestamp,
      };

      (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act
      const result = await guard.canActivate(context);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'refresh-secret' },
      );
      expect(mockSessionRepository.findSession).toHaveBeenCalledWith({
        deviceId: 'device-123',
        userId: 1,
      });
      expect(result).toBe(true);
      expect(request.user).toEqual(payload);
    });

    it('should throw UnauthorizedDomainException when refresh token is missing', async () => {
      // Arrange
      const cookies = {};
      const context = mockExecutionContext(cookies);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(DomainException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          'There is no refresh token in request',
        );
        expect(domainException.extensions[0].field).toBe('refreshToken');
        expect(domainException.message).toBe('Unauthorized');
      }

      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(mockSessionRepository.findSession).not.toHaveBeenCalled();
    });

    // ИЗМЕНЕНИЕ ЗДЕСЬ: Guard не оборачивает JWT ошибки
    it('should throw Error when JWT verification fails', async () => {
      // Arrange
      const cookies = { refreshToken: 'invalid-token' };
      const context = mockExecutionContext(cookies);

      (mockJwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      // Guard пробрасывает ошибку JWT как есть, не оборачивая в DomainException
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
      await expect(guard.canActivate(context)).rejects.toThrow(Error);

      expect(mockJwtService.verify).toHaveBeenCalledWith('invalid-token', {
        secret: 'refresh-secret',
      });
      expect(mockSessionRepository.findSession).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedDomainException when session is not found', async () => {
      // Arrange
      const cookies = { refreshToken: 'valid-token' };
      const context = mockExecutionContext(cookies);

      const payload = {
        userId: 1,
        deviceId: 'device-123',
        exp: 1735689599,
      };

      (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(DomainException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          "User doesn't have session",
        );
        expect(domainException.extensions[0].field).toBe('deviceId');
      }

      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockSessionRepository.findSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedDomainException when userId does not match', async () => {
      // Arrange
      const cookies = { refreshToken: 'valid-token' };
      const context = mockExecutionContext(cookies);

      const payload = {
        userId: 2,
        deviceId: 'device-123',
        exp: 1735689599,
      };

      const sessionWithDifferentUser = { ...mockSession, userId: 1 };
      (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        sessionWithDifferentUser,
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(DomainException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          "User doesn't have session",
        );
        expect(domainException.extensions[0].field).toBe('session');
      }
    });

    it('should throw UnauthorizedDomainException when deviceId does not match', async () => {
      // Arrange
      const cookies = { refreshToken: 'valid-token' };
      const context = mockExecutionContext(cookies);

      const payload = {
        userId: 1,
        deviceId: 'different-device',
        exp: 1735689599,
      };

      (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(DomainException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          "User doesn't have session",
        );
        expect(domainException.extensions[0].field).toBe('session');
      }
    });

    it('should throw UnauthorizedDomainException when expiry does not match', async () => {
      // Arrange
      const cookies = { refreshToken: 'valid-token' };
      const context = mockExecutionContext(cookies);

      const payload = {
        userId: 1,
        deviceId: 'device-123',
        exp: 1234567890,
      };

      (mockJwtService.verify as jest.Mock).mockReturnValue(payload);
      (mockSessionRepository.findSession as jest.Mock).mockResolvedValue(
        mockSession,
      );

      // Act & Assert
      await expect(guard.canActivate(context)).rejects.toThrow(DomainException);

      try {
        await guard.canActivate(context);
      } catch (error) {
        const domainException = error as DomainException;
        expect(domainException.extensions[0].message).toBe(
          "User doesn't have session",
        );
        expect(domainException.extensions[0].field).toBe('session');
      }
    });
  });
});
