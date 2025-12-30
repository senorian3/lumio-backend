import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '@lumio/core/guards/bearer/jwt.strategy';
import { UserAccountsConfig } from '@lumio/modules/user-accounts/config/user-accounts.config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let mockUserAccountsConfig: UserAccountsConfig;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UserAccountsConfig,
          useValue: {
            accessTokenSecret: 'test-access-token-secret',
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    mockUserAccountsConfig = module.get<UserAccountsConfig>(UserAccountsConfig);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure JWT strategy with correct options', () => {
      expect(strategy).toBeInstanceOf(JwtStrategy);
      expect(mockUserAccountsConfig.accessTokenSecret).toBe(
        'test-access-token-secret',
      );
    });
  });

  describe('validate', () => {
    it('should return userId and deviceId from payload', async () => {
      // Arrange
      const payload = { userId: 1, deviceId: 'device-123', tokenVersion: 1 };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 1,
        deviceId: 'device-123',
        tokenVersion: 1,
      });
    });

    it('should return userId and deviceId when payload has additional properties', async () => {
      // Arrange
      const payload = {
        userId: 456,
        deviceId: 'device-456',
        email: 'test@example.com',
        roles: ['user'],
        tokenVersion: 1,
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 456,
        deviceId: 'device-456',
        tokenVersion: 1,
      });
    });

    it('should handle numeric userId converted to string', async () => {
      // Arrange
      const payload = {
        userId: 789,
        deviceId: 'device-789',
        tokenVersion: 1,
      } as any;

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 789,
        deviceId: 'device-789',
        tokenVersion: 1,
      });
    });
  });
});
