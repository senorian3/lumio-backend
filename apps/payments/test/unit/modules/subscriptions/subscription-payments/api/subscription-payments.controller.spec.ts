import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPaymentsController } from '@payments/modules/subscriptions/subscription-payments/api/subscription-payments.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { InternalApiGuard } from '@payments/core/guards/internal/internal-api.guard';
import { StripeWebhookGuard } from '@payments/core/guards/webhook/stripe-webhook.guard';
import { InputCreateSubscriptionPaymentUrlDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/input/input-create-subscription-payment-url.dto';
import { InputChangeAutorenewalSubscriptionPaymentDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/input/input-update-autorenewal.dto';

describe('SubscriptionPaymentsController', () => {
  let subscriptionPaymentsController: SubscriptionPaymentsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockPaymentItems = [
    {
      id: 1,
      amount: 999,
      currency: 'usd',
      status: 'succeeded',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      subscription: {
        id: 'sub_123',
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionPaymentsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(InternalApiGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(StripeWebhookGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    subscriptionPaymentsController = module.get<SubscriptionPaymentsController>(
      SubscriptionPaymentsController,
    );
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('getUserProfilePayments', () => {
    it('should return paginated user payments', async () => {
      const profileId = 1;
      const page = 1;
      const limit = 10;

      const queryResult = {
        items: mockPaymentItems,
        totalCount: 1,
      };

      queryBus.execute.mockResolvedValue(queryResult);

      const result =
        await subscriptionPaymentsController.getUserProfilePayments(
          profileId,
          page,
          limit,
        );

      expect(result).toEqual({
        items: mockPaymentItems,
        total: queryResult.totalCount,
        page,
        limit,
      });
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ profileId, page, limit }),
      );
    });

    it('should use default pagination values', async () => {
      const profileId = 1;
      const defaultPage = 1;
      const defaultLimit = 10;

      const queryResult = {
        items: [],
        totalCount: 0,
      };

      queryBus.execute.mockResolvedValue(queryResult);

      const result =
        await subscriptionPaymentsController.getUserProfilePayments(profileId);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: defaultPage,
        limit: defaultLimit,
      });
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId,
          page: defaultPage,
          limit: defaultLimit,
        }),
      );
    });
  });

  describe('success', () => {
    it('should return success message', () => {
      const result = subscriptionPaymentsController.success();

      expect(result).toBe('Success url');
    });
  });

  describe('error', () => {
    it('should return error message', () => {
      const result = subscriptionPaymentsController.error();

      expect(result).toBe('Error url');
    });
  });

  describe('createSubscriptionPaymentUrl', () => {
    it('should create payment URL', async () => {
      const payload: InputCreateSubscriptionPaymentUrlDto = {
        profileId: '1',
        currency: 'usd',
        subscriptionType: '1 month',
        paymentProvider: 'stripe',
      };

      const expectedUrl = 'https://checkout.stripe.com/pay_123';

      commandBus.execute.mockResolvedValue(expectedUrl);

      const result =
        await subscriptionPaymentsController.createSubscriptionPaymentUrl(
          payload,
        );

      expect(result).toEqual({ url: expectedUrl });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ dto: payload }),
      );
    });
  });

  describe('stripeHook', () => {
    it('should process Stripe webhook', async () => {
      const mockRequest = {
        rawBody: Buffer.from('stripe-webhook-data'),
        body: Buffer.from('stripe-webhook-data'),
      } as any;

      const signature = 'stripe-signature-123';

      commandBus.execute.mockResolvedValue(undefined);

      const result = await subscriptionPaymentsController.stripeHook(
        mockRequest,
        signature,
      );

      expect(result).toEqual({ received: true });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          signature,
          rawBody: mockRequest.rawBody,
        }),
      );
    });

    it('should use body when rawBody is not available', async () => {
      const mockRequest = {
        body: Buffer.from('stripe-webhook-data'),
      } as any;

      const signature = 'stripe-signature-123';

      commandBus.execute.mockResolvedValue(undefined);

      const result = await subscriptionPaymentsController.stripeHook(
        mockRequest,
        signature,
      );

      expect(result).toEqual({ received: true });
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          signature,
          rawBody: mockRequest.body,
        }),
      );
    });
  });

  describe('changeAutorenwal', () => {
    it('should change subscription auto-renewal', async () => {
      const payload: InputChangeAutorenewalSubscriptionPaymentDto = {
        profileId: '1',
        subscriptionId: 'sub_123',
        autoRenewal: false,
      };

      commandBus.execute.mockResolvedValue(undefined);

      await subscriptionPaymentsController.changeAutorenwal(payload);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ dto: payload }),
      );
    });

    it('should enable auto-renewal', async () => {
      const payload: InputChangeAutorenewalSubscriptionPaymentDto = {
        profileId: '1',
        subscriptionId: 'sub_456',
        autoRenewal: true,
      };

      commandBus.execute.mockResolvedValue(undefined);

      await subscriptionPaymentsController.changeAutorenwal(payload);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({ dto: payload }),
      );
    });
  });
});
