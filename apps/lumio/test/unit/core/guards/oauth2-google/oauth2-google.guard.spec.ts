import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from '@lumio/core/guards/oauth2-google/oauth2-google.guard';
import { CoreConfig } from '@lumio/core/core.config';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let mockCoreConfig: CoreConfig;

  const mockCoreConfigValues = {
    googleClientId: 'test-google-client-id',
    googleClientSecret: 'test-google-client-secret',
    googleCallbackUrl: 'http://localhost:3000/auth/google/callback',
  };

  beforeEach(async () => {
    mockCoreConfig = {
      googleClientId: mockCoreConfigValues.googleClientId,
      googleClientSecret: mockCoreConfigValues.googleClientSecret,
      googleCallbackUrl: mockCoreConfigValues.googleCallbackUrl,
    } as CoreConfig;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with correct OAuth2 configuration', () => {
      expect(strategy).toBeInstanceOf(GoogleStrategy);
    });
  });

  describe('validate', () => {
    const mockAccessToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';

    it('should return user data when profile has all fields', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [{ value: 'google@example.com', verified: true }],
      } as any; // Используем any для упрощения

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-123',
        email: 'google@example.com',
        username: 'Google User',
      });
    });

    it('should return email when available', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [{ value: 'user@gmail.com', verified: true }],
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.email).toBe('user@gmail.com');
    });

    it('should return null email when no emails in profile', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: undefined,
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-123',
        email: null,
        username: 'Google User',
      });
    });

    it('should return null email when emails array is empty', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [],
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-123',
        email: null,
        username: 'Google User',
      });
    });

    it('should return null username when displayName is not available', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: undefined,
        emails: [{ value: 'google@example.com', verified: true }],
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-123',
        email: 'google@example.com',
        username: null,
      });
    });

    it('should handle profile with multiple emails', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [
          { value: 'primary@gmail.com', verified: true },
          { value: 'secondary@gmail.com', verified: true },
        ],
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.email).toBe('primary@gmail.com');
    });

    it('should use first email even if not verified', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: 'Google User',
        emails: [{ value: 'unverified@gmail.com', verified: false }],
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result.email).toBe('unverified@gmail.com');
    });

    it('should return correct data for minimal profile', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-minimal-123',
        displayName: null,
        emails: null,
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-minimal-123',
        email: null,
        username: null,
      });
    });
  });

  describe('validate edge cases', () => {
    const mockAccessToken = 'test-access-token';
    const mockRefreshToken = 'test-refresh-token';

    it('should handle empty string displayName', async () => {
      // Arrange
      const mockProfile = {
        id: 'google-123',
        displayName: '',
        emails: [{ value: 'test@example.com', verified: true }],
      } as any;

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
        id: 'google-only-id',
        displayName: undefined,
        emails: undefined,
      } as any;

      // Act
      const result = await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile,
      );

      // Assert
      expect(result).toEqual({
        googleId: 'google-only-id',
        email: null,
        username: null,
      });
    });
  });
});
