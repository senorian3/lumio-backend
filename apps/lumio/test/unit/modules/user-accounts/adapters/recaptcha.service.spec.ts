import { Test, TestingModule } from '@nestjs/testing';
import { RecaptchaService } from '@lumio/modules/user-accounts/adapters/recaptcha.service';
import { CoreConfig } from '@lumio/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecaptchaService,
        {
          provide: CoreConfig,
          useValue: {
            recaptchaSecretKey: 'test-secret-key',
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecaptchaService>(RecaptchaService);
    mockLogger = module.get(AppLoggerService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verify', () => {
    it('should return true when recaptcha verification succeeds with valid score', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          score: 0.9,
          action: 'submit',
          challenge_ts: new Date().toISOString(),
          hostname: 'localhost',
        }),
      };

      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

      const result = await service.verify('valid-token');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('valid-token'),
        }),
      );
    });

    it('should return false when score is below threshold', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          score: 0.3,
          action: 'submit',
          challenge_ts: new Date().toISOString(),
          hostname: 'localhost',
        }),
      };

      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

      const result = await service.verify('low-score-token');

      expect(result).toBe(false);
    });

    it('should return false when success is false', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          score: 0.9,
        }),
      };

      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

      const result = await service.verify('invalid-token');

      expect(result).toBe(false);
    });

    it('should return false when token is empty', async () => {
      const result = await service.verify('');

      expect(result).toBe(false);
    });

    it('should return false when token is whitespace only', async () => {
      const result = await service.verify('   ');

      expect(result).toBe(false);
    });

    it('should return false when fetch response is not ok', async () => {
      const mockResponse = {
        ok: false,
      };

      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

      const result = await service.verify('some-token');

      expect(result).toBe(false);
    });

    it('should return false and log error when fetch throws', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await service.verify('some-token');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('reCAPTCHA'),
        expect.any(String),
        'RecaptchaService',
      );
    });
  });
});
