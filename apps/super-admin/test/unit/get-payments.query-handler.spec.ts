import { Test, TestingModule } from '@nestjs/testing';
import {
  GetPaymentsHandler,
  GetPaymentsQuery,
} from '@super-admin/modules/users/application/queries/get-payments.query-handler';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { PaymentsHttpClient } from '@super-admin/core/integration/payments-http.client';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentSortBy } from '@super-admin/core/integration/dto/payment-sort-by.enum';

describe('GetPaymentsHandler', () => {
  let handler: GetPaymentsHandler;

  const mockUserQueryRepository = {
    findMany: jest.fn(),
    findByProfileIds: jest.fn(),
  };

  const mockPaymentsHttpClient = {
    getAllPayments: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentsHandler,
        {
          provide: UserQueryRepository,
          useValue: mockUserQueryRepository,
        },
        {
          provide: PaymentsHttpClient,
          useValue: mockPaymentsHttpClient,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    handler = module.get<GetPaymentsHandler>(GetPaymentsHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated payments successfully', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.DATE_DESC,
      );

      const mockPaymentsResponse = {
        data: [
          {
            id: 1,
            customPaymentId: 'pay_1',
            profileId: 100,
            autoRenewal: true,
            paymentProvider: 'stripe',
            currency: 'usd',
            amount: 29.99,
            status: 'completed',
            createdAt: '2026-01-01T00:00:00.000Z',
            nextPaymentDate: '2026-02-01T00:00:00.000Z',
            stripePaymentCreatedAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            cancelledAt: null,
            subscriptionId: 'sub_1',
            mainSubscriptionId: 'main_sub_1',
            stripeSubscriptionId: 'stripe_sub_1',
            subscriptionType: 'monthly',
            periodStart: '2026-01-01T00:00:00.000Z',
            periodEnd: '2026-02-01T00:00:00.000Z',
            paymentsUrl: 'https://payments.example.com/pay_1',
          },
        ],
        totalCount: 1,
      };

      const mockUsers = [
        {
          id: 1,
          username: 'testuser',
          email: 'test@test.com',
          createdAt: new Date('2026-01-01'),
          isBlocked: false,
          profile: {
            id: 100,
            avatarUrl: 'avatar.jpg',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      ];

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue(
        mockPaymentsResponse,
      );
      mockUserQueryRepository.findByProfileIds.mockResolvedValue(mockUsers);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(1);
      expect(result.pagesCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].username).toBe('testuser');
      expect(result.items[0].avatarUrl).toBe('avatar.jpg');
    });

    it('should return empty result when no payments found', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.DATE_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(0);
      expect(result.pagesCount).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should calculate pages count correctly', async () => {
      const query = new GetPaymentsQuery(
        1,
        5,
        undefined,
        PaymentSortBy.DATE_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 23,
      });

      const result = await handler.execute(query);

      expect(result.pagesCount).toBe(5); // ceil(23/5) = 5
    });

    it('should search by username when search parameter is provided', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        'john',
        PaymentSortBy.DATE_DESC,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([
        {
          id: 1,
          username: 'john_doe',
          email: 'john@test.com',
          createdAt: new Date(),
          isBlocked: false,
          profile: { id: 100 },
        },
      ]);

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockUserQueryRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john',
        }),
      );
      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          profileIds: [100],
        }),
      );
    });

    it('should return empty result when search yields no users', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        'nonexistent',
        PaymentSortBy.DATE_DESC,
      );

      mockUserQueryRepository.findMany.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(mockPaymentsHttpClient.getAllPayments).not.toHaveBeenCalled();
    });

    it('should handle AMOUNT_ASC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.AMOUNT_ASC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'amount',
          sortOrder: 'asc',
        }),
      );
    });

    it('should handle AMOUNT_DESC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.AMOUNT_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'amount',
          sortOrder: 'desc',
        }),
      );
    });

    it('should handle PAYMENT_METHOD_ASC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.PAYMENT_METHOD_ASC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'paymentProvider',
          sortOrder: 'asc',
        }),
      );
    });

    it('should handle PAYMENT_METHOD_DESC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.PAYMENT_METHOD_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'paymentProvider',
          sortOrder: 'desc',
        }),
      );
    });

    it('should handle USERNAME_ASC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.USERNAME_ASC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'asc',
        }),
      );
    });

    it('should handle USERNAME_DESC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.USERNAME_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
      );
    });

    it('should handle DATE_ASC sort order', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.DATE_ASC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'asc',
        }),
      );
    });

    it('should return empty result and log error when exception occurs', async () => {
      const query = new GetPaymentsQuery(
        1,
        10,
        undefined,
        PaymentSortBy.DATE_DESC,
      );
      const mockError = new Error('API error');

      mockPaymentsHttpClient.getAllPayments.mockRejectedValue(mockError);

      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should calculate skip correctly for pagination', async () => {
      const query = new GetPaymentsQuery(
        3,
        10,
        undefined,
        PaymentSortBy.DATE_DESC,
      );

      mockPaymentsHttpClient.getAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      await handler.execute(query);

      expect(mockPaymentsHttpClient.getAllPayments).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10 = 20
          take: 10,
        }),
      );
    });
  });
});
