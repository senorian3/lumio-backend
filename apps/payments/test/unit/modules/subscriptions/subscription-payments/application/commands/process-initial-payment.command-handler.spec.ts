import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { RetryService } from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import {
  ProcessInitialPaymentCommandHandler,
  ProcessInitialPaymentCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/process-initial-payment.command-handler';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import Stripe from 'stripe';

describe('ProcessInitialPaymentCommandHandler', () => {
  let handler: ProcessInitialPaymentCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;
  let mockOutboxService: jest.Mocked<OutboxService>;
  let mockPrisma: any;
  let mockManualReviewService: jest.Mocked<ManualReviewService>;
  let mockRetryService: jest.Mocked<RetryService>;

  const mockSession = {
    id: 'cs_test_123',
    subscription: 'sub_123',
    metadata: {
      customPaymentId: 'payment_123',
      mainSubscriptionId: 'null',
    },
    created: Date.now() / 1000,
  } as unknown as Stripe.Checkout.Session;

  const mockEvent = {
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: { object: mockSession },
  } as unknown as Stripe.Event;

  const mockPayment = {
    customPaymentId: 'payment_123',
    profileId: 1,
    amount: 100,
    currency: 'RUB',
    subscriptionType: '1 month',
    paymentProvider: 'stripe',
  };

  const mockSubscriptionDetails = {
    billing_cycle_anchor: Date.now() / 1000,
  } as unknown as Stripe.Subscription;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessInitialPaymentCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findByCustomPaymentId: jest.fn(),
            findBySubscriptionId: jest.fn(),
            updateCustomPaymentId: jest.fn(),
            updateSubPeriodEndDate: jest.fn(),
          },
        },
        {
          provide: StripeAdapter,
          useValue: {
            getSubscriptionDetails: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: OutboxService,
          useValue: {
            createPaymentCompletedMessage: jest.fn(),
            updateCustomerSubscriptionEndDateMessage: jest.fn(),
            createCancelSubscriptionImmediatelyMessage: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ManualReviewService,
          useValue: {
            createFailedInitialPaymentTask: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {
            executeWithRetry: jest.fn((fn) => fn()),
          },
        },
      ],
    }).compile();

    handler = module.get<ProcessInitialPaymentCommandHandler>(
      ProcessInitialPaymentCommandHandler,
    );
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockStripeAdapter = module.get(StripeAdapter);
    mockOutboxService = module.get(OutboxService);
    mockManualReviewService = module.get(ManualReviewService);
    mockRetryService = module.get(RetryService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process initial payment successfully', async () => {
      // Arrange
      const command = new ProcessInitialPaymentCommand(mockSession, mockEvent);

      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(
        mockPayment as any,
      );
      mockStripeAdapter.getSubscriptionDetails.mockResolvedValue(
        mockSubscriptionDetails,
      );
      mockPaymentsRepository.updateCustomPaymentId.mockResolvedValue(undefined);
      mockOutboxService.createPaymentCompletedMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPaymentsRepository.findByCustomPaymentId).toHaveBeenCalledWith(
        mockSession.metadata.customPaymentId,
      );
      expect(mockStripeAdapter.getSubscriptionDetails).toHaveBeenCalledWith(
        'sub_123',
      );
      expect(mockPaymentsRepository.updateCustomPaymentId).toHaveBeenCalledWith(
        expect.objectContaining({
          customPaymentId: 'payment_123',
          subscriptionId: 'sub_123',
          status: PaymentStatus.SUCCESSFUL,
          autoRenewal: true,
        }),
        mockPrisma,
      );
      expect(
        mockOutboxService.createPaymentCompletedMessage,
      ).toHaveBeenCalled();
    });

    it('should process extension subscription payment successfully', async () => {
      // Arrange
      const extensionSession = {
        ...mockSession,
        metadata: {
          ...mockSession.metadata,
          mainSubscriptionId: 'main_sub_123',
        },
      } as unknown as Stripe.Checkout.Session;

      const command = new ProcessInitialPaymentCommand(
        extensionSession,
        mockEvent,
      );

      const mockMainSubscription = {
        customPaymentId: 'main_payment_123',
        subscriptionId: 'main_sub_123',
        periodEnd: new Date('2024-01-01'),
        nextPaymentDate: new Date('2024-01-01'),
        subscriptionType: '1 month',
      };

      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(
        mockPayment as any,
      );
      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockMainSubscription as any,
      );
      mockStripeAdapter.getSubscriptionDetails.mockResolvedValue(
        mockSubscriptionDetails,
      );
      mockPaymentsRepository.updateCustomPaymentId.mockResolvedValue(undefined);
      mockPaymentsRepository.updateSubPeriodEndDate.mockResolvedValue(
        undefined,
      );
      mockOutboxService.createPaymentCompletedMessage.mockResolvedValue(
        undefined,
      );
      mockOutboxService.updateCustomerSubscriptionEndDateMessage.mockResolvedValue(
        undefined,
      );
      mockOutboxService.createCancelSubscriptionImmediatelyMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPaymentsRepository.findByCustomPaymentId).toHaveBeenCalledWith(
        extensionSession.metadata.customPaymentId,
      );
      expect(mockPaymentsRepository.findBySubscriptionId).toHaveBeenCalledWith(
        'main_sub_123',
      );
      expect(mockPaymentsRepository.updatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          customPaymentId: 'payment_123',
          subscriptionId: 'sub_123',
          status: PaymentStatus.EXTENSION,
          autoRenewal: false,
        }),
        mockPrisma,
      );
      expect(mockPaymentsRepository.updateSubPeriodEndDate).toHaveBeenCalled();
      expect(
        mockOutboxService.updateCustomerSubscriptionEndDateMessage,
      ).toHaveBeenCalled();
      expect(
        mockOutboxService.createCancelSubscriptionImmediatelyMessage,
      ).toHaveBeenCalled();
      expect(
        mockOutboxService.createPaymentCompletedMessage,
      ).toHaveBeenCalled();
    });

    it('should throw error when payment not found', async () => {
      // Arrange
      const command = new ProcessInitialPaymentCommand(mockSession, mockEvent);

      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(null);
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw new Error(
          `Payment with customPaymentId ${mockSession.metadata.customPaymentId} not found`,
        );
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(Error);
    });

    it('should handle database error', async () => {
      // Arrange
      const command = new ProcessInitialPaymentCommand(mockSession, mockEvent);
      const dbError = new Error('Database error');

      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(
        mockPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw dbError;
      });
      mockManualReviewService.createFailedInitialPaymentTask.mockResolvedValue(
        undefined,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(
        mockManualReviewService.createFailedInitialPaymentTask,
      ).toHaveBeenCalled();
    });

    it('should handle manual review service error', async () => {
      // Arrange
      const command = new ProcessInitialPaymentCommand(mockSession, mockEvent);
      const processError = new Error('Processing error');

      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(
        mockPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw processError;
      });
      mockManualReviewService.createFailedInitialPaymentTask.mockRejectedValue(
        new Error('Manual review error'),
      );

      // Act & Assert
      // Note: In the current implementation, if manual review service throws,
      // the original error is still thrown, not the manual review error
      await expect(handler.execute(command)).rejects.toThrow(
        'Manual review error',
      );

      expect(
        mockManualReviewService.createFailedInitialPaymentTask,
      ).toHaveBeenCalled();
    });
  });
});
