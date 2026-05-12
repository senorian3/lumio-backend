import { Test, TestingModule } from '@nestjs/testing';
import {
  GetAllPaymentsHandler,
  GetAllPaymentsQuery,
} from '@payments/modules/subscriptions/subscription-payments/application/queries/get-all-payments.query-handler';
import { QueryPaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.query-repository';

describe('GetAllPaymentsHandler', () => {
  let handler: GetAllPaymentsHandler;
  let queryPaymentsRepository: { findAllPayments: jest.Mock };

  const mockPayment = {
    id: 1,
    amount: 9.99,
    currency: 'usd',
    status: 'active',
    profileId: 1,
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllPaymentsHandler,
        {
          provide: QueryPaymentsRepository,
          useValue: {
            findAllPayments: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetAllPaymentsHandler>(GetAllPaymentsHandler);
    queryPaymentsRepository = module.get(QueryPaymentsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return all payments with default params', async () => {
      const result = { data: [mockPayment], totalCount: 1 };
      queryPaymentsRepository.findAllPayments.mockResolvedValue(result);

      const query = new GetAllPaymentsQuery();
      const response = await handler.execute(query);

      expect(response).toEqual(result);
      expect(queryPaymentsRepository.findAllPayments).toHaveBeenCalledWith(
        undefined,
        0,
        10,
        'createdAt',
        'desc',
        undefined,
      );
    });

    it('should pass all query params to repository', async () => {
      queryPaymentsRepository.findAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      const query = new GetAllPaymentsQuery(
        [1, 2],
        5,
        20,
        'amount',
        'asc',
        'active',
      );
      await handler.execute(query);

      expect(queryPaymentsRepository.findAllPayments).toHaveBeenCalledWith(
        [1, 2],
        5,
        20,
        'amount',
        'asc',
        'active',
      );
    });

    it('should return empty result when no payments', async () => {
      queryPaymentsRepository.findAllPayments.mockResolvedValue({
        data: [],
        totalCount: 0,
      });

      const query = new GetAllPaymentsQuery();
      const response = await handler.execute(query);

      expect(response).toEqual({ data: [], totalCount: 0 });
    });
  });
});
