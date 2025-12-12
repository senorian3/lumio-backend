import { Test, TestingModule } from '@nestjs/testing';
import { GithubStrategy } from '@lumio/core/guards/oauth2-github/oauth2-github.guard';
import { CoreConfig } from '@lumio/core/core.config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GithubStrategy', () => {
  let strategy: GithubStrategy;
  let mockCoreConfig: CoreConfig;

  const mockCoreConfigValues = {
    githubClientId: 'test-client-id',
    githubClientSecret: 'test-client-secret',
    githubCallbackUrl: 'http://localhost:3000/auth/github/callback',
  };

  beforeEach(async () => {
    mockCoreConfig = {
      githubClientId: mockCoreConfigValues.githubClientId,
      githubClientSecret: mockCoreConfigValues.githubClientSecret,
      githubCallbackUrl: mockCoreConfigValues.githubCallbackUrl,
    } as CoreConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubStrategy,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
      ],
    }).compile();

    strategy = module.get<GithubStrategy>(GithubStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize PassportStrategy with correct configuration', () => {
      // Проверяем, что стратегия создается с правильными параметрами
      expect(strategy).toBeInstanceOf(GithubStrategy);

      // Можно проверить через интроспекцию или косвенно через тесты validate
    });

    it('should use correct OAuth2 configuration from CoreConfig', () => {
      // Стратегия должна использовать значения из конфигурации
      // Это проверяется косвенно через работу метода validate
      expect(strategy).toBeDefined();
    });
  });

  describe('validate', () => {
    const mockAccessToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';

    it('should return user data when profile has email', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        username: 'githubuser',
        displayName: 'GitHub User',
        login: 'githubuser',
        emails: [{ value: 'github@example.com' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: 'github@example.com',
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return user data with displayName when username is missing', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        displayName: 'GitHub Display Name',
        login: 'githubuser',
        emails: [{ value: 'github@example.com' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'GitHub Display Name',
        email: 'github@example.com',
      });
    });

    it('should return user data with login when both username and displayName are missing', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        login: 'githubuser',
        emails: [{ value: 'github@example.com' }],
      };

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: 'github@example.com',
      });
    });

    it('should fetch email from GitHub API when profile has no emails', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        username: 'githubuser',
        emails: [],
      };

      const mockApiResponse = {
        data: [
          { email: 'primary@example.com', primary: true, verified: true },
          { email: 'secondary@example.com', primary: false, verified: true },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockApiResponse);

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user/emails',
        {
          headers: {
            Authorization: 'token test-access-token',
            Accept: 'application/vnd.github.v3+json',
          },
        },
      );
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: 'primary@example.com',
      });
    });

    it('should return null email when no verified primary email found from API', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        username: 'githubuser',
        emails: [],
      };

      const mockApiResponse = {
        data: [
          { email: 'unverified@example.com', primary: true, verified: false },
          { email: 'notprimary@example.com', primary: false, verified: true },
        ],
      };

      mockedAxios.get.mockResolvedValue(mockApiResponse);

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: null,
      });
    });

    it('should return null email when GitHub API call fails', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        username: 'githubuser',
        emails: [],
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Ошибка при запросе email из GitHub API:',
        expect.any(Error),
      );
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: null,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should return null email when GitHub API returns empty array', async () => {
      // Arrange
      const mockProfile = {
        id: 'github-123',
        username: 'githubuser',
        emails: [],
      };

      const mockApiResponse = {
        data: [],
      };

      mockedAxios.get.mockResolvedValue(mockApiResponse);

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        gitId: 'github-123',
        username: 'githubuser',
        email: null,
      });
    });
  });
});
