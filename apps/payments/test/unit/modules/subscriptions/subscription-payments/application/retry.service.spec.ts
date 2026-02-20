import { Test, TestingModule } from '@nestjs/testing';
import {
  RetryService,
  RetryOptions,
} from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('RetryService', () => {
  let service: RetryService;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
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

    service = module.get<RetryService>(RetryService);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeWithRetry', () => {
    it('should return result on first successful attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await service.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should retry and succeed after failures', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const options: RetryOptions = {
        maxRetries: 5,
        baseDelay: 1,
        maxDelay: 10,
      };

      const result = await service.executeWithRetry(operation, options);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should throw error after exhausting all retries', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Persistent error'));

      const options: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1,
        maxDelay: 10,
      };

      await expect(
        service.executeWithRetry(operation, options),
      ).rejects.toThrow('Persistent error');

      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('should use default options when not provided', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('ok');

      jest.spyOn(service as any, 'delay').mockResolvedValue(undefined);

      const result = await service.executeWithRetry(operation);

      expect(result).toBe('ok');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect maxDelay cap for exponential backoff', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockResolvedValue('done');

      const delaySpy = jest
        .spyOn(service as any, 'delay')
        .mockResolvedValue(undefined);

      const options: RetryOptions = {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 5000,
      };

      await service.executeWithRetry(operation, options);

      const delayValues = delaySpy.mock.calls.map((call) => call[0]);
      delayValues.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(5000);
      });
    });
  });
});
