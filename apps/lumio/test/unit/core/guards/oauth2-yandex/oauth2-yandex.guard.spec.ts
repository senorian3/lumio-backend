import { Test, TestingModule } from '@nestjs/testing';
import { YandexStrategy } from '@lumio/core/guards/oauth2-yandex/oauth2-yandex.guard';
import { CoreConfig } from '@lumio/core/core.config';

describe('YandexStrategy', () => {
  let strategy: YandexStrategy;
  let mockCoreConfig: CoreConfig;

  const mockCoreConfigValues = {
    yandexClientId: 'test-yandex-client-id',
    yandexClientSecret: 'test-yandex-client-secret',
    yandexCallbackUrl: 'http://localhost:3000/auth/yandex/callback',
  };

  beforeEach(async () => {
    mockCoreConfig = {
      yandexClientId: mockCoreConfigValues.yandexClientId,
      yandexClientSecret: mockCoreConfigValues.yandexClientSecret,
      yandexCallbackUrl: mockCoreConfigValues.yandexCallbackUrl,
    } as CoreConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexStrategy,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
      ],
    }).compile();

    strategy = module.get<YandexStrategy>(YandexStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize PassportStrategy with correct configuration', () => {
      expect(strategy).toBeInstanceOf(YandexStrategy);
      // Можно проверить, что конфигурация передается правильно через CoreConfig
    });
  });

  describe('validate', () => {
    const mockAccessToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';

    it('should return user data when profile has all fields', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-123',
        username: 'yandexuser',
        emails: [{ value: 'yandex@example.com' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-123',
        email: 'yandex@example.com',
        username: 'yandexuser',
      });
    });

    it('should return email when available', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-456',
        username: 'yandexuser2',
        emails: [{ value: 'user@yandex.ru' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.email).toBe('user@yandex.ru');
    });

    it('should return null email when no emails in profile', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-789',
        username: 'yandexuser3',
        emails: undefined,
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-789',
        email: null,
        username: 'yandexuser3',
      });
    });

    it('should return null email when emails array is empty', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-999',
        username: 'yandexuser4',
        emails: [],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-999',
        email: null,
        username: 'yandexuser4',
      });
    });

    it('should return null username when username is not available', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-111',
        username: undefined,
        emails: [{ value: 'test@yandex.ru' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-111',
        email: 'test@yandex.ru',
        username: null,
      });
    });

    it('should handle profile with multiple emails', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-222',
        username: 'multiemail',
        emails: [
          { value: 'primary@yandex.ru' },
          { value: 'secondary@yandex.ru' },
        ],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.email).toBe('primary@yandex.ru');
    });

    it('should return correct data for minimal profile', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-minimal',
        username: null,
        emails: null,
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-minimal',
        email: null,
        username: null,
      });
    });

    it('should handle empty string username', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-333',
        username: '',
        emails: [{ value: 'empty@yandex.ru' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.username).toBe('');
    });

    it('should handle profile with only id', async () => {
      // Arrange
      const mockProfile = {
        id: 'yandex-only-id',
        username: undefined,
        emails: undefined,
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        yandexId: 'yandex-only-id',
        email: null,
        username: null,
      });
    });
  });
});
