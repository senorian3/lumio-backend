import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { OutboxRepository } from '@payments/modules/subscriptions/outbox/domain/outbox.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  OutboxAggregateType,
  OutboxEventType,
} from '@payments/modules/subscriptions/constants/outbox-constants';
import { CreatePaymentCompleteMessageDto } from '@libs/dto/transfer/create-payment-complete-message.dto';
import { CreateSubscriptionUpdateMessageDto } from '@libs/dto/transfer/create-subscription-update-message.dto';
import { CreateSubscriptionDeletedMessageDto } from '@libs/dto/transfer/create-subscription-deleted-message.dto';

describe('OutboxService', () => {
  let service: OutboxService;
  let mockOutboxRepository: jest.Mocked<OutboxRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: OutboxRepository,
          useValue: {
            createOutboxMessage: jest.fn(),
            cleanupExpiredMessages: jest.fn(),
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

    service = module.get<OutboxService>(OutboxService);
    mockOutboxRepository = module.get(OutboxRepository);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentCompletedMessage', () => {
    const mockPayload: CreatePaymentCompleteMessageDto = {
      paymentId: 'payment_123',
      profileId: 1,
      amount: 9.99,
      currency: 'usd',
      subscriptionId: 'sub_123',
      subscriptionType: '1 month',
      periodStart: new Date(),
      periodEnd: new Date(),
      timestamp: new Date().toISOString(),
      paymentsService: 'stripe',
    } as CreatePaymentCompleteMessageDto;

    it('should create outbox message successfully', async () => {
      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createPaymentCompletedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: mockPayload.paymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.PAYMENT_COMPLETED,
          payload: mockPayload,
        }),
        undefined,
      );
    });

    it('should create outbox message with transaction', async () => {
      const mockTx = {};
      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createPaymentCompletedMessage(mockPayload, mockTx);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: mockPayload.paymentId,
        }),
        mockTx,
      );
    });

    it('should create fallback message when primary creation fails', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);

      await service.createPaymentCompletedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw when both primary and fallback creation fail', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('Critical error'));

      await expect(
        service.createPaymentCompletedMessage(mockPayload),
      ).rejects.toThrow('Critical error');

      expect(mockLogger.error).toHaveBeenCalledTimes(2);
    });
  });

  describe('createSubscriptionUpdatedMessage', () => {
    const mockPayload: CreateSubscriptionUpdateMessageDto = {
      paymentId: 'payment_456',
      subscriptionId: 'sub_456',
      subscriptionType: '1 month',
      nextPaymentDate: new Date(),
      profileId: 1,
    } as CreateSubscriptionUpdateMessageDto;

    it('should create outbox message successfully', async () => {
      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createSubscriptionUpdatedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: mockPayload.paymentId,
          aggregateType: OutboxAggregateType.PAYMENT,
          eventType: OutboxEventType.PAYMENT_RECURRING_COMPLETED,
          payload: mockPayload,
        }),
        undefined,
      );
    });

    it('should create fallback message when primary creation fails', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);

      await service.createSubscriptionUpdatedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledTimes(2);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw when both primary and fallback creation fail', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('Critical error'));

      await expect(
        service.createSubscriptionUpdatedMessage(mockPayload),
      ).rejects.toThrow('Critical error');
    });
  });

  describe('createChangeSubscriptionAutoRenewalStripe', () => {
    const subscriptionId = 'sub_789';
    const autoRenewal = false;

    it('should create outbox message successfully', async () => {
      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createChangeSubscriptionAutoRenewalStripe(
        subscriptionId,
        autoRenewal,
      );

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: subscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.CHANGE_SUBSCRIPTION_AUTORENEWAL_STRIPE,
          payload: expect.objectContaining({
            stripeSubscriptionId: subscriptionId,
            autoRenewal,
          }),
        }),
        undefined,
      );
    });

    it('should create fallback message when primary creation fails', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);

      await service.createChangeSubscriptionAutoRenewalStripe(
        subscriptionId,
        autoRenewal,
      );

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledTimes(2);
    });

    it('should throw when both primary and fallback creation fail', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('Critical error'));

      await expect(
        service.createChangeSubscriptionAutoRenewalStripe(
          subscriptionId,
          autoRenewal,
        ),
      ).rejects.toThrow('DB error');
    });
  });

  describe('createSubscriptionDeletedMessage', () => {
    const mockPayload: CreateSubscriptionDeletedMessageDto = {
      subscriptionId: 'sub_del_123',
      stripeSubscriptionId: 'stripe_sub_del_123',
      profileId: 1,
      timestamp: new Date().toISOString(),
    } as CreateSubscriptionDeletedMessageDto;

    it('should create outbox message successfully', async () => {
      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createSubscriptionDeletedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId: mockPayload.stripeSubscriptionId,
          aggregateType: OutboxAggregateType.SUBSCRIPTION,
          eventType: OutboxEventType.SUBSCRIPTION_DELETED,
          payload: mockPayload,
        }),
        undefined,
      );
    });

    it('should create fallback message when primary creation fails', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce({} as any);

      await service.createSubscriptionDeletedMessage(mockPayload);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledTimes(2);
    });

    it('should throw when both primary and fallback creation fail', async () => {
      mockOutboxRepository.createOutboxMessage
        .mockRejectedValueOnce(new Error('DB error'))
        .mockRejectedValueOnce(new Error('Critical error'));

      await expect(
        service.createSubscriptionDeletedMessage(mockPayload),
      ).rejects.toThrow('DB error');
    });
  });

  describe('cleanupExpiredMessages', () => {
    it('should delegate to repository', async () => {
      mockOutboxRepository.cleanupExpiredMessages.mockResolvedValue(5);

      await service.cleanupExpiredMessages();

      expect(mockOutboxRepository.cleanupExpiredMessages).toHaveBeenCalled();
    });
  });

  describe('createManualReviewTask', () => {
    it('should create manual review outbox message', async () => {
      const payload = { type: 'test', error: 'some error' };
      const aggregateId = 'agg_123';
      const aggregateType = OutboxAggregateType.PAYMENT;

      mockOutboxRepository.createOutboxMessage.mockResolvedValue({} as any);

      await service.createManualReviewTask(payload, aggregateId, aggregateType);

      expect(mockOutboxRepository.createOutboxMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          aggregateId,
          aggregateType,
          eventType: OutboxEventType.MANUAL_REVIEW_REQUIRED,
          payload,
        }),
      );
    });
  });
});
