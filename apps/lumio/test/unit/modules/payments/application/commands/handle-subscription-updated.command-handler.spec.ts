import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import {
  HandleSubscriptionRecurringUpdatedCommandHandler,
  HandleSubscriptionRecurringUpdatedCommand,
} from '@lumio/modules/payments/application/commands/handle-subscription-updated.command-handler';
import { SubscriptionRecurringUpdatedEvent } from '@lumio/modules/payments/api/dto/transfer/subscription-recurring-updated-event.dto';

describe('HandleSubscriptionRecurringUpdatedCommandHandler', () => {
  let handler: HandleSubscriptionRecurringUpdatedCommandHandler;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;

  const mockPayload = {
    paymentId: 'pay-123',
    paymentService: 'yookassa',
    amount: 100,
    currency: 'RUB',
    subscriptionId: 'sub-123',
    subscriptionType: '1 month',
    nextPaymentDate: new Date('2024-03-01'),
    profileId: 1,
    timestamp: new Date().toISOString(),
  };

  const mockSubscription = {
    id: 'sub-123',
    durationType: '1 month',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-02-01'),
    autoRenewal: true,
    cancelledAt: null,
    userProfileId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleSubscriptionRecurringUpdatedCommandHandler,
        {
          provide: SubscriptionRepository,
          useValue: {
            findActiveSubscriptionByProfileId: jest.fn(),
            updateSubscriptionWithNewPayment: jest.fn(),
          },
        },
        {
          provide: PaymentsRepository,
          useValue: {
            createPayment: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
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

    handler = module.get<HandleSubscriptionRecurringUpdatedCommandHandler>(
      HandleSubscriptionRecurringUpdatedCommandHandler,
    );
    mockSubscriptionRepository = module.get(SubscriptionRepository);
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockPrisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process subscription updated successfully', async () => {
      // Arrange
      const mockEvent = new SubscriptionRecurringUpdatedEvent(
        1,
        123,
        'Subscription',
        'SubscriptionRecurringUpdated',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionRecurringUpdatedCommand(mockEvent);

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback({
          subscriptionRepository: mockSubscriptionRepository,
          paymentsRepository: mockPaymentsRepository,
        } as any);
        return undefined;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findActiveSubscriptionByProfileId,
      ).toHaveBeenCalledWith(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPaymentsRepository.createPayment).toHaveBeenCalledWith(
        {
          id: 'pay-123',
          amount: 100,
          paymentsService: 'yookassa',
          currency: 'RUB',
          subscriptionId: 'sub-123',
          datePayment: expect.any(Date),
          endDate: new Date('2024-03-01'),
        },
        expect.any(Object),
      );
      expect(
        mockSubscriptionRepository.updateSubscriptionWithNewPayment,
      ).toHaveBeenCalledWith(
        'sub-123',
        '1 month',
        new Date('2024-03-01'),
        true,
        expect.any(Object),
      );
    });

    it('should return early when subscription not found', async () => {
      // Arrange
      const mockEvent = new SubscriptionRecurringUpdatedEvent(
        1,
        123,
        'Subscription',
        'SubscriptionRecurringUpdated',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionRecurringUpdatedCommand(mockEvent);

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        null,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findActiveSubscriptionByProfileId,
      ).toHaveBeenCalledWith(1);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle database error when processing subscription update', async () => {
      // Arrange
      const mockEvent = new SubscriptionRecurringUpdatedEvent(
        1,
        123,
        'Subscription',
        'SubscriptionRecurringUpdated',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionRecurringUpdatedCommand(mockEvent);
      const dbError = new Error('Database connection failed');

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });
  });
});
