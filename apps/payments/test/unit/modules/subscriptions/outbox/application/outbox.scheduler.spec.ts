import { Test, TestingModule } from '@nestjs/testing';
import { OutboxScheduler } from '@payments/modules/subscriptions/outbox/application/outbox.scheduler';
import { OutboxRepository } from '@payments/modules/subscriptions/outbox/domain/outbox.repository';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { ExternalCallsProcessor } from '@payments/modules/subscriptions/outbox/application/external-calls.processor';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxEventType } from '@payments/modules/subscriptions/constants/outbox-constants';

describe('OutboxScheduler', () => {
  let scheduler: OutboxScheduler;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockExternalCallsProcessor: jest.Mocked<ExternalCallsProcessor>;
  let mockLumioService: { emit: jest.Mock };
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    mockLumioService = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxScheduler,
        {
          provide: 'LUMIO_SERVICE',
          useValue: mockLumioService,
        },
        {
          provide: OutboxRepository,
          useValue: {
            findPendingMessages: jest.fn(),
            markAsProcessing: jest.fn(),
            markAsCompleted: jest.fn(),
            incrementRetryCount: jest.fn(),
            cleanupExpiredMessages: jest.fn(),
          },
        },
        {
          provide: PaymentsRepository,
          useValue: {
            deleteExpiredPendingPayments: jest.fn(),
          },
        },
        {
          provide: ExternalCallsProcessor,
          useValue: {
            processChangeSubscriptionAutoRenewal: jest.fn(),
            processFailedInitialPayment: jest.fn(),
            processFailedRecurringPayment: jest.fn(),
            processFailedSubscriptionChangeAutoRenewal: jest.fn(),
            processFailedSubscriptionDeleted: jest.fn(),
            processManualReviewRequired: jest.fn(),
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

    scheduler = module.get<OutboxScheduler>(OutboxScheduler);
    mockOutboxRepository = module.get(OutboxRepository);
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockExternalCallsProcessor = module.get(ExternalCallsProcessor);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('processOutboxMessages', () => {
    it('should return early when no pending messages', async () => {
      mockOutboxRepository.findPendingMessages.mockResolvedValue([]);

      await scheduler.processOutboxMessages();

      expect(mockOutboxRepository.findPendingMessages).toHaveBeenCalledWith(
        100,
      );
      expect(mockOutboxRepository.markAsProcessing).not.toHaveBeenCalled();
    });

    it('should process CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE event', async () => {
      const mockMessage = {
        id: 1,
        eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE,
        payload: { subscriptionId: 'sub_123', autoRenewal: false },
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);
      mockExternalCallsProcessor.processChangeSubscriptionAutoRenewal.mockResolvedValue(
        true,
      );

      await scheduler.processOutboxMessages();

      expect(mockOutboxRepository.markAsProcessing).toHaveBeenCalledWith(1);
      expect(
        mockExternalCallsProcessor.processChangeSubscriptionAutoRenewal,
      ).toHaveBeenCalledWith(mockMessage);
      expect(mockOutboxRepository.markAsCompleted).toHaveBeenCalledWith(
        1,
        expect.any(Date),
      );
    });

    it('should process PAYMENT_COMPLETED event by sending to Lumio', async () => {
      const mockMessage = {
        id: 2,
        eventType: OutboxEventType.PAYMENT_COMPLETED,
        aggregateId: 'agg_123',
        aggregateType: 'payment',
        payload: { paymentId: 'pay_123' },
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);

      await scheduler.processOutboxMessages();

      expect(mockLumioService.emit).toHaveBeenCalledWith(
        'payment.completed',
        expect.objectContaining({
          id: mockMessage.id,
          aggregateId: mockMessage.aggregateId,
          payload: mockMessage.payload,
        }),
      );
      expect(mockOutboxRepository.markAsCompleted).toHaveBeenCalledWith(
        2,
        expect.any(Date),
      );
    });

    it('should process PAYMENT_RECURRING_COMPLETED event by sending to Lumio', async () => {
      const mockMessage = {
        id: 3,
        eventType: OutboxEventType.PAYMENT_RECURRING_COMPLETED,
        aggregateId: 'agg_456',
        aggregateType: 'payment',
        payload: { paymentId: 'pay_456' },
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);

      await scheduler.processOutboxMessages();

      expect(mockLumioService.emit).toHaveBeenCalledWith(
        'payment.recurring.completed',
        expect.objectContaining({ id: 3 }),
      );
    });

    it('should process SUBSCRIPTION_DELETED event by sending to Lumio', async () => {
      const mockMessage = {
        id: 4,
        eventType: OutboxEventType.SUBSCRIPTION_DELETED,
        aggregateId: 'sub_789',
        aggregateType: 'subscription',
        payload: { subscriptionId: 'sub_789' },
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);

      await scheduler.processOutboxMessages();

      expect(mockLumioService.emit).toHaveBeenCalledWith(
        'subscription.deleted',
        expect.objectContaining({ id: 4 }),
      );
    });

    it('should process FAILED_INITIAL_PAYMENT_PROCESSING event', async () => {
      const mockMessage = {
        id: 5,
        eventType: OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING,
        payload: {},
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);
      mockExternalCallsProcessor.processFailedInitialPayment.mockResolvedValue(
        true,
      );

      await scheduler.processOutboxMessages();

      expect(
        mockExternalCallsProcessor.processFailedInitialPayment,
      ).toHaveBeenCalledWith(mockMessage);
      expect(mockOutboxRepository.markAsCompleted).toHaveBeenCalledWith(
        5,
        expect.any(Date),
      );
    });

    it('should process MANUAL_REVIEW_REQUIRED event', async () => {
      const mockMessage = {
        id: 6,
        eventType: OutboxEventType.MANUAL_REVIEW_REQUIRED,
        payload: {},
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);
      mockExternalCallsProcessor.processManualReviewRequired.mockResolvedValue(
        true,
      );

      await scheduler.processOutboxMessages();

      expect(
        mockExternalCallsProcessor.processManualReviewRequired,
      ).toHaveBeenCalledWith(mockMessage);
    });

    it('should increment retry count when processing returns false', async () => {
      const mockMessage = {
        id: 7,
        eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE,
        payload: {},
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);
      mockExternalCallsProcessor.processChangeSubscriptionAutoRenewal.mockResolvedValue(
        false,
      );

      await scheduler.processOutboxMessages();

      expect(mockOutboxRepository.incrementRetryCount).toHaveBeenCalledWith(7);
      expect(mockOutboxRepository.markAsCompleted).not.toHaveBeenCalled();
    });

    it('should increment retry count and log error when processing throws', async () => {
      const mockMessage = {
        id: 8,
        eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE,
        payload: {},
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);
      mockExternalCallsProcessor.processChangeSubscriptionAutoRenewal.mockRejectedValue(
        new Error('Processing error'),
      );

      await scheduler.processOutboxMessages();

      expect(mockOutboxRepository.incrementRetryCount).toHaveBeenCalledWith(8);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle unknown event type with result false', async () => {
      const mockMessage = {
        id: 9,
        eventType: 'unknown.event',
        payload: {},
        createdAt: new Date(),
      };

      mockOutboxRepository.findPendingMessages.mockResolvedValue([
        mockMessage as any,
      ]);

      await scheduler.processOutboxMessages();

      expect(mockOutboxRepository.incrementRetryCount).toHaveBeenCalledWith(9);
    });

    it('should log critical error when findPendingMessages throws', async () => {
      mockOutboxRepository.findPendingMessages.mockRejectedValue(
        new Error('DB connection error'),
      );

      await scheduler.processOutboxMessages();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Critical error'),
        expect.any(String),
        'OutboxScheduler',
      );
    });
  });

  describe('cleanupExpiredPendingPayments', () => {
    it('should cleanup expired pending payments', async () => {
      mockPaymentsRepository.deleteExpiredPendingPayments.mockResolvedValue(3);

      await scheduler.cleanupExpiredPendingPayments();

      expect(
        mockPaymentsRepository.deleteExpiredPendingPayments,
      ).toHaveBeenCalledWith(expect.any(Date));
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('3'),
        'OutboxScheduler',
      );
    });

    it('should not log when no payments cleaned up', async () => {
      mockPaymentsRepository.deleteExpiredPendingPayments.mockResolvedValue(0);

      await scheduler.cleanupExpiredPendingPayments();

      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should log error when cleanup fails', async () => {
      mockPaymentsRepository.deleteExpiredPendingPayments.mockRejectedValue(
        new Error('DB error'),
      );

      await scheduler.cleanupExpiredPendingPayments();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredMessages', () => {
    it('should cleanup expired messages', async () => {
      mockOutboxRepository.cleanupExpiredMessages.mockResolvedValue(5);

      await scheduler.cleanupExpiredMessages();

      expect(mockOutboxRepository.cleanupExpiredMessages).toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('5'),
        'OutboxScheduler',
      );
    });

    it('should not log when no messages cleaned up', async () => {
      mockOutboxRepository.cleanupExpiredMessages.mockResolvedValue(0);

      await scheduler.cleanupExpiredMessages();

      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should log error when cleanup fails', async () => {
      mockOutboxRepository.cleanupExpiredMessages.mockRejectedValue(
        new Error('DB error'),
      );

      await scheduler.cleanupExpiredMessages();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
