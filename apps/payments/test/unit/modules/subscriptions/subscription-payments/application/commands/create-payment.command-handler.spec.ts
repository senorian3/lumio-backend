import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateSubscriptionPaymentCommand,
  CreateSubscriptionPaymentCommandHandler,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/create-payment.command-handler';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionPaymentTransferDto } from '@libs/dto/transfer/subscription-payment.transfer.dto';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SubscriptionType } from '@libs/core/types/subscription-type';

describe('CreateSubscriptionPaymentCommandHandler', () => {
  let handler: CreateSubscriptionPaymentCommandHandler;
  let paymentsRepository: {
    findPendingPaymentByProfileId: jest.Mock;
    findActiveSubscriptionPaymentByProfileId: jest.Mock;
    createPayment: jest.Mock;
  };
  let stripeAdapter: {
    createPaymentSession: jest.Mock;
    cancelSession: jest.Mock;
  };
  let logger: {
    error: jest.Mock;
    warn: jest.Mock;
    log: jest.Mock;
  };

  const mockSession = {
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
    created: Math.floor(Date.now() / 1000),
    metadata: {
      customPaymentId: '1-1700000000000',
    },
  };

  const mockPendingPayment = {
    paymentsUrl: 'https://checkout.stripe.com/pending',
  };

  const mockActiveSubscription = {
    subscriptionId: 'sub_active_123',
  };

  const mockCreatedPayment = {
    paymentsUrl: 'https://checkout.stripe.com/test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubscriptionPaymentCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findPendingPaymentByProfileId: jest.fn(),
            findActiveSubscriptionPaymentByProfileId: jest.fn(),
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
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreateSubscriptionPaymentCommandHandler>(
      CreateSubscriptionPaymentCommandHandler,
    );
    paymentsRepository = module.get(PaymentsRepository);
    stripeAdapter = module.get(StripeAdapter);
    logger = module.get(AppLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return existing pending payment URL if found', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(
        mockPendingPayment,
      );

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);
      const result = await handler.execute(command);

      expect(result).toBe('https://checkout.stripe.com/pending');
      expect(
        paymentsRepository.findPendingPaymentByProfileId,
      ).toHaveBeenCalledWith(1);
      expect(stripeAdapter.createPaymentSession).not.toHaveBeenCalled();
    });

    it('should create new payment session and payment when no pending payment', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(null);
      paymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      stripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      paymentsRepository.createPayment.mockResolvedValue(mockCreatedPayment);

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);
      const result = await handler.execute(command);

      expect(result).toBe('https://checkout.stripe.com/test');
      expect(stripeAdapter.createPaymentSession).toHaveBeenCalledWith(
        SubscriptionType.ONE_MONTH,
        9.99,
        '1',
        'usd',
        'null',
      );
      expect(paymentsRepository.createPayment).toHaveBeenCalled();
    });

    it('should pass active subscription id to stripe when exists', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(null);
      paymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        mockActiveSubscription,
      );
      stripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      paymentsRepository.createPayment.mockResolvedValue(mockCreatedPayment);

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);
      await handler.execute(command);

      expect(stripeAdapter.createPaymentSession).toHaveBeenCalledWith(
        SubscriptionType.ONE_MONTH,
        9.99,
        '1',
        'usd',
        'sub_active_123',
      );
    });

    it('should throw BadRequestDomainException when stripe session creation fails', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(null);
      paymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      stripeAdapter.createPaymentSession.mockRejectedValue(
        new Error('Stripe API error'),
      );

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should cancel stripe session when payment creation fails', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(null);
      paymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      stripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      paymentsRepository.createPayment.mockRejectedValue(
        new Error('Database error'),
      );

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(stripeAdapter.cancelSession).toHaveBeenCalledWith('cs_test_123');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log warning when cancel session fails', async () => {
      paymentsRepository.findPendingPaymentByProfileId.mockResolvedValue(null);
      paymentsRepository.findActiveSubscriptionPaymentByProfileId.mockResolvedValue(
        null,
      );
      stripeAdapter.createPaymentSession.mockResolvedValue(mockSession);
      paymentsRepository.createPayment.mockRejectedValue(
        new Error('Database error'),
      );
      stripeAdapter.cancelSession.mockRejectedValue(
        new Error('Stripe cancel error'),
      );

      const dto = new SubscriptionPaymentTransferDto();
      dto.profileId = '1';
      dto.currency = 'usd';
      dto.subscriptionType = SubscriptionType.ONE_MONTH;
      dto.paymentProvider = 'stripe';

      const command = new CreateSubscriptionPaymentCommand(dto);

      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
