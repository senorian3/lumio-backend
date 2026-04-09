import { Test, TestingModule } from '@nestjs/testing';
import { ExternalCallsProcessor } from '@payments/modules/subscriptions/outbox/application/external-calls.processor';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxMessage } from '@generated/prisma-payments';

describe('ExternalCallsProcessor', () => {
  let processor: ExternalCallsProcessor;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalCallsProcessor,
        {
          provide: StripeAdapter,
          useValue: {
            changeSubscriptionAutoRenewal: jest.fn(),
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

    processor = module.get<ExternalCallsProcessor>(ExternalCallsProcessor);
    mockStripeAdapter = module.get(StripeAdapter);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('processChangeSubscriptionAutoRenewal', () => {
    const mockMessage = {
      id: 1,
      payload: {
        stripeSubscriptionId: 'sub_123',
        autoRenewal: false,
      },
    } as unknown as OutboxMessage;

    it('should return true when stripe call succeeds', async () => {
      mockStripeAdapter.changeSubscriptionAutoRenewal.mockResolvedValue(
        undefined,
      );

      const result =
        await processor.processChangeSubscriptionAutoRenewal(mockMessage);

      expect(result).toBe(true);
      expect(
        mockStripeAdapter.changeSubscriptionAutoRenewal,
      ).toHaveBeenCalledWith('sub_123', false);
    });

    it('should return false and log error when stripe call fails', async () => {
      mockStripeAdapter.changeSubscriptionAutoRenewal.mockRejectedValue(
        new Error('Stripe error'),
      );

      const result =
        await processor.processChangeSubscriptionAutoRenewal(mockMessage);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('sub_123'),
        expect.any(String),
        'ExternalCallsProcessor',
      );
    });
  });

  describe('processFailedInitialPayment', () => {
    const mockMessage = {
      id: 2,
      payload: {
        type: 'failed',
        sessionId: 'sess_123',
        error: 'Payment failed',
        timestamp: new Date().toISOString(),
        retryCount: 3,
      },
    } as unknown as OutboxMessage;

    it('should return true on successful processing', async () => {
      const result = await processor.processFailedInitialPayment(mockMessage);

      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('processFailedRecurringPayment', () => {
    const mockMessage = {
      id: 3,
      payload: {
        type: 'failed',
        invoiceId: 'inv_123',
        subscriptionId: 'sub_123',
        error: 'Recurring payment failed',
        timestamp: new Date().toISOString(),
        retryCount: 2,
      },
    } as unknown as OutboxMessage;

    it('should return true on successful processing', async () => {
      const result = await processor.processFailedRecurringPayment(mockMessage);

      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('processFailedSubscriptionChangeAutoRenewal', () => {
    const mockMessage = {
      id: 4,
      payload: {
        type: 'failed',
        subscriptionId: 'sub_456',
        timestamp: new Date().toISOString(),
        retryCount: 1,
      },
    } as unknown as OutboxMessage;

    it('should return true on successful processing', async () => {
      const result =
        await processor.processFailedSubscriptionChangeAutoRenewal(mockMessage);

      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('processFailedSubscriptionDeleted', () => {
    const mockMessage = {
      id: 5,
      payload: {
        subscriptionId: 'sub_789',
        profileId: 1,
        error: 'Delete failed',
        timestamp: new Date().toISOString(),
      },
    } as unknown as OutboxMessage;

    it('should return true on successful processing', async () => {
      const result =
        await processor.processFailedSubscriptionDeleted(mockMessage);

      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('processManualReviewRequired', () => {
    const mockMessage = {
      id: 6,
      payload: {
        type: 'manual_review',
        subscriptionId: 'sub_review',
        customPaymentId: 'pay_review',
        error: 'Needs review',
        timestamp: new Date().toISOString(),
        retryCount: 5,
      },
    } as unknown as OutboxMessage;

    it('should return true on successful processing', async () => {
      const result = await processor.processManualReviewRequired(mockMessage);

      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });
});
