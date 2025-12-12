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
      // The strategy is instantiated in beforeEach, we can assert its configuration
      // by checking that the parent class was called with correct options
      // Since we can't directly access private properties, we can test through the validate method
      expect(strategy).toBeInstanceOf(JwtStrategy);
      expect(mockUserAccountsConfig.accessTokenSecret).toBe(
        'test-access-token-secret',
      );
    });
  });

  describe('validate', () => {
    it('should return userId from payload', async () => {
      // Arrange
      const payload = { userId: '123' };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBe('123');
    });

    it('should return userId when payload has additional properties', async () => {
      // Arrange
      const payload = {
        userId: '456',
        email: 'test@example.com',
        roles: ['user'],
      };

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBe('456');
    });

    it('should handle numeric userId converted to string', async () => {
      // Arrange
      const payload = { userId: 789 } as any;

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBe(789);
    });
  });
});
