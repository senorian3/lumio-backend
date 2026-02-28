import { Test, TestingModule } from '@nestjs/testing';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { CoreConfig } from '@payments/core/core.config';

describe('StripeAdapter', () => {
  let adapter: StripeAdapter;
  let mockCoreConfig: jest.Mocked<CoreConfig>;

  // Mock Stripe instance
  let mockStripeCheckout: any;
  let mockStripeWebhooks: any;
  let mockStripeSubscriptions: any;

  beforeEach(async () => {
    // Create mock methods
    mockStripeCheckout = {
      sessions: {
        create: jest.fn(),
        expire: jest.fn(),
      },
    };
    mockStripeWebhooks = {
      constructEvent: jest.fn(),
    };
    mockStripeSubscriptions = {
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeAdapter,
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: CoreConfig,
          useValue: {
            stripeApiKey: 'sk_test_123',
            stripeEndpointSecret: 'whsec_123',
            stripeSuccessUrl: 'https://example.com/success',
            stripeCancelUrl: 'https://example.com/cancel',
          },
        },
      ],
    }).compile();

    adapter = module.get<StripeAdapter>(StripeAdapter);
    mockCoreConfig = module.get(CoreConfig);

    // Replace the internal stripe client with our mocks
    (adapter as any).stripe = {
      checkout: mockStripeCheckout,
      webhooks: mockStripeWebhooks,
      subscriptions: mockStripeSubscriptions,
    };
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('createPaymentSession', () => {
    it('should create payment session successfully', async () => {
      // Arrange
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      };
      mockStripeCheckout.sessions.create.mockResolvedValue(mockSession);

      // Act
      const result = await adapter.createPaymentSession(
        '1 month',
        1000,
        '1',
        'RUB',
        false,
      );

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockStripeCheckout.sessions.create).toHaveBeenCalled();
    });

    it('should throw error when Stripe fails', async () => {
      // Arrange
      mockStripeCheckout.sessions.create.mockRejectedValue(
        new Error('Stripe error'),
      );

      // Act & Assert
      await expect(
        adapter.createPaymentSession('1 month', 1000, '1', 'RUB', false),
      ).rejects.toThrow('Stripe error');
    });
  });

  describe('verify', () => {
    it('should verify webhook successfully', async () => {
      // Arrange
      const mockEvent = { id: 'evt_123', type: 'checkout.session.completed' };
      mockStripeWebhooks.constructEvent.mockResolvedValue(mockEvent);

      const rawBody = Buffer.from('test body');
      const signature = 'sig_123';

      // Act
      const result = await adapter.verify(rawBody, signature);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(mockStripeWebhooks.constructEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
        mockCoreConfig.stripeEndpointSecret,
      );
    });

    it('should throw error on verify failure', async () => {
      // Arrange
      mockStripeWebhooks.constructEvent.mockRejectedValue(
        new Error('Invalid signature'),
      );

      // Act & Assert
      await expect(
        adapter.verify(Buffer.from('test'), 'invalid_sig'),
      ).rejects.toThrow('Invalid signature');
    });
  });

  describe('getSubscriptionDetails', () => {
    it('should retrieve subscription details successfully', async () => {
      // Arrange
      const mockSubscription = { id: 'sub_123', status: 'active' };
      mockStripeSubscriptions.retrieve.mockResolvedValue(mockSubscription);

      // Act
      const result = await adapter.getSubscriptionDetails('sub_123');

      // Assert
      expect(result).toEqual(mockSubscription);
      expect(mockStripeSubscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    });

    it('should throw error on retrieval failure', async () => {
      // Arrange
      mockStripeSubscriptions.retrieve.mockRejectedValue(
        new Error('Subscription not found'),
      );

      // Act & Assert
      await expect(adapter.getSubscriptionDetails('sub_123')).rejects.toThrow(
        'Subscription not found',
      );
    });
  });

  describe('changeSubscriptionAutoRenewal', () => {
    it('should change auto renewal successfully', async () => {
      // Arrange
      mockStripeSubscriptions.update.mockResolvedValue({});

      // Act
      await adapter.changeSubscriptionAutoRenewal('sub_123', false);

      // Assert
      expect(mockStripeSubscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      });
    });

    it('should throw error on update failure', async () => {
      // Arrange
      mockStripeSubscriptions.update.mockRejectedValue(
        new Error('Update failed'),
      );

      // Act & Assert
      await expect(
        adapter.changeSubscriptionAutoRenewal('sub_123', true),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('cancelSession', () => {
    it('should cancel session successfully', async () => {
      // Arrange
      mockStripeCheckout.sessions.expire.mockResolvedValue({});

      // Act
      await adapter.cancelSession('cs_test_123');

      // Assert
      expect(mockStripeCheckout.sessions.expire).toHaveBeenCalledWith(
        'cs_test_123',
      );
    });

    it('should throw error on cancel failure', async () => {
      // Arrange
      mockStripeCheckout.sessions.expire.mockRejectedValue(
        new Error('Cancel failed'),
      );

      // Act & Assert
      await expect(adapter.cancelSession('cs_test_123')).rejects.toThrow(
        'Cancel failed',
      );
    });
  });

  describe('cancelSubscriptionImmediately', () => {
    it('should cancel subscription successfully', async () => {
      // Arrange
      mockStripeSubscriptions.cancel.mockResolvedValue({});

      // Act
      await adapter.cancelSubscriptionImmediately('sub_123');

      // Assert
      expect(mockStripeSubscriptions.cancel).toHaveBeenCalledWith('sub_123');
    });

    it('should throw error on cancel failure', async () => {
      // Arrange
      mockStripeSubscriptions.cancel.mockRejectedValue(
        new Error('Cancel failed'),
      );

      // Act & Assert
      await expect(
        adapter.cancelSubscriptionImmediately('sub_123'),
      ).rejects.toThrow('Cancel failed');
    });
  });
});
