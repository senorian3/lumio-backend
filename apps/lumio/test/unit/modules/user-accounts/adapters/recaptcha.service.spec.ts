import { Test, TestingModule } from '@nestjs/testing';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@lumio/core/core.config';

// Mock fetch globally
global.fetch = jest.fn();

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let mockConfigService: CoreConfig;
  let mockLoggerService: AppLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaService,
        {
          provide: CoreConfig,
          useValue: {
            recaptchaSecretKey: 'secret-key',
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecaptchaService>(RecaptchaService);
    mockConfigService = module.get<CoreConfig>(CoreConfig);
    mockLoggerService = module.get<AppLoggerService>(AppLoggerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify', () => {
    it('should return true when secret key is not set (disabled)', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = undefined;
      const token = 'any-token';

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return false when token is empty', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = '';

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return false when token is only whitespace', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = '   ';

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return false when fetch response is not ok', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      // Act
      const result = await service.verify(token);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'secret=secret-key&response=valid-token',
        },
      );
      expect(result).toBe(false);
    });

    it('should return false when recaptcha response success is false', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          score: 0.8,
        }),
      });

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when score is below threshold', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          score: 0.3,
        }),
      });

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when token is valid and score is above threshold', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          score: 0.8,
        }),
      });

      // Act
      const result = await service.verify(token);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'secret=secret-key&response=valid-token',
        },
      );
      expect(result).toBe(true);
    });

    it('should handle fetch errors gracefully', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Act & Assert
      const result = await service.verify(token);
      expect(result).toBe(false);
    });

    it('should log error when fetch fails', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      const error = new Error('Network error');
      (fetch as jest.Mock).mockRejectedValue(error);

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `Ошибка проверки reCAPTCHA: ${error.message}`,
        error.stack,
        RecaptchaService.name,
      );
    });

    it('should log error when JSON parsing fails', async () => {
      // Arrange
      mockConfigService.recaptchaSecretKey = 'secret-key';
      const token = 'valid-token';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      // Act
      const result = await service.verify(token);

      // Assert
      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });
});
