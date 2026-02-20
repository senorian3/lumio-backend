import { Test, TestingModule } from '@nestjs/testing';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { OutboxEventType } from '@payments/modules/subscriptions/constants/outbox-constants';
import Stripe from 'stripe';

describe('ManualReviewService', () => {
  let service: ManualReviewService;
  let mockOutboxService: jest.Mocked<OutboxService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualReviewService,
        {
          provide: OutboxService,
          useValue: {
            createManualReviewTask: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ManualReviewService>(ManualReviewService);
    mockOutboxService = module.get(OutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFailedInitialPaymentTask', () => {
    it('should create failed initial payment task', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_123',
        subscription: 'sub_123',
        metadata: { customPaymentId: 'payment_123' },
      } as unknown as Stripe.Checkout.Session;
      const error = new Error('Payment failed');

      mockOutboxService.createManualReviewTask.mockResolvedValue(undefined);

      // Act
      await service.createFailedInitialPaymentTask(mockSession, error);

      // Assert
      expect(mockOutboxService.createManualReviewTask).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OutboxEventType.FAILED_INITIAL_PAYMENT_PROCESSING,
          sessionId: mockSession.id,
          subscriptionId: mockSession.subscription,
          customPaymentId: mockSession.metadata.customPaymentId,
          error: error.message,
          retryCount: 5,
        }),
        mockSession.metadata.customPaymentId,
        'payment',
      );
    });
  });

  describe('createFailedRecurringPaymentTask', () => {
    it('should create failed recurring payment task', async () => {
      // Arrange
      const mockInvoice = {
        id: 'in_test_123',
        lines: {
          data: [{ subscription: 'sub_123' }],
        },
      } as unknown as Stripe.Invoice;
      const error = new Error('Payment failed');

      mockOutboxService.createManualReviewTask.mockResolvedValue(undefined);

      // Act
      await service.createFailedRecurringPaymentTask(mockInvoice, error);

      // Assert
      expect(mockOutboxService.createManualReviewTask).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OutboxEventType.FAILED_RECURRING_PAYMENT_PROCESSING,
          invoiceId: mockInvoice.id,
          subscriptionId: 'sub_123',
          error: error.message,
          retryCount: 5,
        }),
        undefined,
        'payment',
      );
    });
  });

  describe('createFailedAutoRenewalChangeTask', () => {
    it('should create failed auto renewal change task', async () => {
      // Arrange
      const subscriptionId = 'sub_123';
      const customPaymentId = 'payment_123';
      const error = new Error('Update failed');

      mockOutboxService.createManualReviewTask.mockResolvedValue(undefined);

      // Act
      await service.createFailedAutoRenewalChangeTask(
        subscriptionId,
        customPaymentId,
        error,
      );

      // Assert
      expect(mockOutboxService.createManualReviewTask).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OutboxEventType.FAILED_SUBSCRIPTION_CHANGE_AUTO_RENEWAL_PROCESSING,
          subscriptionId,
          customPaymentId,
          error: error.message,
          retryCount: 5,
        }),
        customPaymentId,
        'payment',
      );
    });
  });

  describe('createFailedSubscriptionDeletedTask', () => {
    it('should create failed subscription deleted task', async () => {
      // Arrange
      const subscriptionId = 'sub_123';
      const error = new Error('Deletion failed');

      mockOutboxService.createManualReviewTask.mockResolvedValue(undefined);

      // Act
      await service.createFailedSubscriptionDeletedTask(subscriptionId, error);

      // Assert
      expect(mockOutboxService.createManualReviewTask).toHaveBeenCalledWith(
        expect.objectContaining({
          type: OutboxEventType.FAILED_SUBSCRIPTION_DELETED_PROCESSING,
          subscriptionId,
          error: error.message,
          retryCount: 5,
        }),
        undefined,
        'payment',
      );
    });
  });
});
