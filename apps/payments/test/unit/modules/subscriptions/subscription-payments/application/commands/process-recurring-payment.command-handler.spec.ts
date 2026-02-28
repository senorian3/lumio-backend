import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { AppLoggerService } from '@libs/logger/logger.service';
import { RetryService } from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import {
  ProcessRecurringPaymentCommandHandler,
  ProcessRecurringPaymentCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/process-recurring-payment.command-handler';
import Stripe from 'stripe';
describe('ProcessRecurringPaymentCommandHandler', () => {
  let handler: ProcessRecurringPaymentCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockOutboxService: jest.Mocked<OutboxService>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockPrisma: any;
  let mockManualReviewService: jest.Mocked<ManualReviewService>;
  let mockRetryService: jest.Mocked<RetryService>;

  const mockInvoice = {
    id: 'in_123',
    billing_reason: 'subscription_cycle',
    status: 'paid',
    parent: {
      subscription_details: {
        subscription: 'sub_123',
      },
    },
    amount_paid: 10000,
    currency: 'rub',
    created: Date.now() / 1000,
    lines: {
      data: [
        {
          period: {
            start: Date.now() / 1000,
            end: Date.now() / 1000 + 30 * 24 * 60 * 60,
          },
        },
      ],
    },
    metadata: {
      subscriptionType: '1 month',
    },
  } as unknown as Stripe.Invoice;

  const mockExistingPayment = {
    subscriptionId: 'sub_123',
    profileId: 1,
    customPaymentId: 'payment_123',
    autoRenewal: true,
    subscriptionType: '1 month',
    paymentProvider: 'Stripe',
  };

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessRecurringPaymentCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findBySubscriptionId: jest.fn(),
            createPayment: jest.fn(),
            completePayment: jest.fn(),
          },
        },
        {
          provide: OutboxService,
          useValue: {
            createSubscriptionUpdatedMessage: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ManualReviewService,
          useValue: {
            createFailedRecurringPaymentTask: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {
            executeWithRetry: jest.fn((fn) => fn()),
          },
        },
        {
          provide: StripeAdapter,
          useValue: {
            getSubscriptionDetails: jest.fn(),
            isExtensionSubscription: jest.fn(),
          },
        },
      ],
    }).compile();
    handler = module.get<ProcessRecurringPaymentCommandHandler>(
      ProcessRecurringPaymentCommandHandler,
    );
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockOutboxService = module.get(OutboxService);
    mockLogger = module.get(AppLoggerService);
    mockManualReviewService = module.get(ManualReviewService);
    mockRetryService = module.get(RetryService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process recurring payment successfully', async () => {
      // Arrange
      const command = new ProcessRecurringPaymentCommand(mockInvoice);

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockExistingPayment as any,
      );
      mockPaymentsRepository.createPayment.mockResolvedValue({} as any);
      mockPaymentsRepository.completePayment.mockResolvedValue(undefined);
      mockOutboxService.createSubscriptionUpdatedMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPaymentsRepository.findBySubscriptionId).toHaveBeenCalledWith(
        'sub_123',
      );
      expect(mockPaymentsRepository.createPayment).toHaveBeenCalled();
      expect(mockPaymentsRepository.completePayment).toHaveBeenCalled();
      expect(
        mockOutboxService.createSubscriptionUpdatedMessage,
      ).toHaveBeenCalled();
    });

    it('should skip when billing_reason is subscription_create', async () => {
      // Arrange
      const invoiceWithSubscriptionCreate = {
        ...mockInvoice,
        billing_reason: 'subscription_create',
      } as unknown as Stripe.Invoice;
      const command = new ProcessRecurringPaymentCommand(
        invoiceWithSubscriptionCreate,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockPaymentsRepository.findBySubscriptionId,
      ).not.toHaveBeenCalled();
    });

    it('should skip when invoice status is not paid', async () => {
      // Arrange
      const unpaidInvoice = {
        ...mockInvoice,
        status: 'open',
      } as unknown as Stripe.Invoice;
      const command = new ProcessRecurringPaymentCommand(unpaidInvoice);

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockPaymentsRepository.findBySubscriptionId,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      const command = new ProcessRecurringPaymentCommand(mockInvoice);

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(null);
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw new Error();
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(Error);
    });

    it('should handle database error', async () => {
      // Arrange
      const command = new ProcessRecurringPaymentCommand(mockInvoice);
      const dbError = new Error('Database error');

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockExistingPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw dbError;
      });
      mockManualReviewService.createFailedRecurringPaymentTask.mockResolvedValue(
        undefined,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(
        mockManualReviewService.createFailedRecurringPaymentTask,
      ).toHaveBeenCalled();
    });

    it('should handle manual review service error', async () => {
      // Arrange
      const command = new ProcessRecurringPaymentCommand(mockInvoice);
      const processError = new Error('Processing error');

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockExistingPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw processError;
      });
      mockManualReviewService.createFailedRecurringPaymentTask.mockRejectedValue(
        new Error('Manual review error'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(processError);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
