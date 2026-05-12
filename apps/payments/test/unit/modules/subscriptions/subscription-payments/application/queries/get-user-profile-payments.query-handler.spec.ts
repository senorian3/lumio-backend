import { Test, TestingModule } from '@nestjs/testing';
import {
  GetUserProfilePaymentsQuery,
  GetUserProfilePaymentsQueryHandler,
} from '@payments/modules/subscriptions/subscription-payments/application/queries/get-user-profile-payments.query-handler';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';

describe('GetUserProfilePaymentsQueryHandler', () => {
  let handler: GetUserProfilePaymentsQueryHandler;
  let paymentsRepository: { findAllUserProfilePayments: jest.Mock };

  const mockPayment = {
    id: 1,
    amount: 9.99,
    currency: 'usd',
    paymentProvider: 'stripe',
    subscriptionType: '1_month',
    stripePaymentCreatedAt: new Date('2026-01-01'),
    periodEnd: new Date('2026-02-01'),
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfilePaymentsQueryHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findAllUserProfilePayments: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUserProfilePaymentsQueryHandler>(
      GetUserProfilePaymentsQueryHandler,
    );
    paymentsRepository = module.get(PaymentsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return mapped payments with total count', async () => {
      paymentsRepository.findAllUserProfilePayments.mockResolvedValue({
        payments: [mockPayment],
        totalCount: 1,
      });

      const query = new GetUserProfilePaymentsQuery(1, 1, 10, 'date_desc');
      const result = await handler.execute(query);

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 1,
        datePayment: mockPayment.stripePaymentCreatedAt.toISOString(),
        endDate: mockPayment.periodEnd.toISOString(),
        amount: Number(mockPayment.amount),
        currency: 'usd',
        paymentProvider: 'stripe',
        subscriptionType: '1_month',
      });
      expect(
        paymentsRepository.findAllUserProfilePayments,
      ).toHaveBeenCalledWith(1, 1, 10, 'date_desc');
    });

    it('should use default sortBy when not provided', async () => {
      paymentsRepository.findAllUserProfilePayments.mockResolvedValue({
        payments: [],
        totalCount: 0,
      });

      const query = new GetUserProfilePaymentsQuery(1, 1, 10);
      await handler.execute(query);

      expect(
        paymentsRepository.findAllUserProfilePayments,
      ).toHaveBeenCalledWith(1, 1, 10, 'date_desc');
    });

    it('should return empty items when no payments', async () => {
      paymentsRepository.findAllUserProfilePayments.mockResolvedValue({
        payments: [],
        totalCount: 0,
      });

      const query = new GetUserProfilePaymentsQuery(1, 1, 10);
      const result = await handler.execute(query);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should handle payment without periodEnd', async () => {
      const paymentWithoutPeriodEnd = {
        ...mockPayment,
        periodEnd: null,
      };
      paymentsRepository.findAllUserProfilePayments.mockResolvedValue({
        payments: [paymentWithoutPeriodEnd],
        totalCount: 1,
      });

      const query = new GetUserProfilePaymentsQuery(1, 1, 10);
      const result = await handler.execute(query);

      expect(result.items[0].endDate).toBe(
        paymentWithoutPeriodEnd.createdAt.toISOString(),
      );
    });

    it('should handle payment without subscriptionType', async () => {
      const paymentWithoutType = {
        ...mockPayment,
        subscriptionType: null,
      };
      paymentsRepository.findAllUserProfilePayments.mockResolvedValue({
        payments: [paymentWithoutType],
        totalCount: 1,
      });

      const query = new GetUserProfilePaymentsQuery(1, 1, 10);
      const result = await handler.execute(query);

      expect(result.items[0].subscriptionType).toBeNull();
    });
  });
});
