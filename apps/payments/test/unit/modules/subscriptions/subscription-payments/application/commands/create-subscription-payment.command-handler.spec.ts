import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { SubscriptionType } from '@libs/core/types/subscription-type';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { SUBSCRIPTION_PRICES } from '@payments/modules/subscriptions/constants/stripe-constants';
import {
  CreateSubscriptionPaymentCommandHandler,
  CreateSubscriptionPaymentCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import Stripe from 'stripe';

describe('CreateSubscriptionPaymentCommandHandler', () => {
  let handler: CreateSubscriptionPaymentCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockPrisma: any;

  const mockDto: SubscriptionPaymentTransferDto = {
    profileId: '1',
    subscriptionType: SubscriptionType.ONE_MONTH,
    currency: 'RUB',
    paymentProvider: 'Stripe',
  };
  const mockSession = {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    created: Date.now() / 1000,
    metadata: { customPaymentId: 'payment_123' },
  } as unknown as Stripe.Checkout.Session;
  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubscriptionPaymentCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findActiveSubscriptionPaymentByProfileId: jest.fn(),
            findPendingPaymentByProfileId: jest.fn(),
            createPayment: jest.fn(),
          },
        },
        {
          provide: StripeAdapter,
          useValue: {
            createPaymentSession: jest.fn(),
            cancelSession: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    handler = module.get<CreateSubscriptionPaymentCommandHandler>(
      CreateSubscriptionPaymentCommandHandler,
    );
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockStripeAdapter = module.get(StripeAdapter);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create payment session successfully', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentCommand(mockDto);

      mockPaymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      mockPaymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(
        null,
      );
      mockStripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      mockPaymentsRepository.createPayment.mockResolvedValue({
        paymentsUrl: mockSession.url,
      } as any);
      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockStripeAdapter.createPaymentSession).toHaveBeenCalledWith(
        mockDto.subscriptionType,
        SUBSCRIPTION_PRICES[mockDto.subscriptionType],
        mockDto.profileId,
        mockDto.currency,
        'null',
      );
      expect(result).toBe(mockSession.url);
    });

    it('should create payment session with existing subscription', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentCommand(mockDto);
      const mockActiveSubscription = {
        subscriptionId: 'sub_123',
      };

      mockPaymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        mockActiveSubscription as any,
      );
      mockPaymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(
        null,
      );
      mockStripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      mockPaymentsRepository.createPayment.mockResolvedValue({
        paymentsUrl: mockSession.url,
      } as any);
      // Act
      const result = await handler.execute(command);

      // Assert
      expect(mockStripeAdapter.createPaymentSession).toHaveBeenCalledWith(
        mockDto.subscriptionType,
        SUBSCRIPTION_PRICES[mockDto.subscriptionType],
        mockDto.profileId,
        mockDto.currency,
        'sub_123',
      );
      expect(result).toBe(mockSession.url);
    });

    it('should throw BadRequestDomainException when Stripe session creation fails', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentCommand(mockDto);

      mockPaymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      mockStripeAdapter.createPaymentSession.mockRejectedValue(
        new Error('Stripe error'),
      );
      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should throw BadRequestDomainException when database fails', async () => {
      // Arrange
      const command = new CreateSubscriptionPaymentCommand(mockDto);

      mockPaymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      mockStripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      mockPaymentsRepository.createPayment.mockRejectedValue(
        new Error('Database error'),
      );
      mockStripeAdapter.cancelSession.mockResolvedValue(undefined);
      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockStripeAdapter.cancelSession).toHaveBeenCalledWith(
        mockSession.id,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
