import { Test, TestingModule } from '@nestjs/testing';
import { QueryPaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.query-repository';
import { PrismaService } from '@payments/prisma/prisma.service';

describe('QueryPaymentsRepository', () => {
  let repository: QueryPaymentsRepository;
  let prisma: {
    payment: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockPayment = {
    id: 1,
    amount: 9.99,
    currency: 'usd',
    status: 'active',
    profileId: 1,
    subscriptionType: '1_month',
    paymentProvider: 'stripe',
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryPaymentsRepository,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<QueryPaymentsRepository>(QueryPaymentsRepository);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPayments', () => {
    it('should return all payments with default params', async () => {
      prisma.payment.findMany.mockResolvedValue([mockPayment]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await repository.findAllPayments();

      expect(result.data).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.payment.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter by profileIds', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllPayments([1, 2]);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { profileId: { in: [1, 2] } },
        }),
      );
    });

    it('should not filter by empty profileIds', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllPayments([]);

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should search by subscriptionType', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllPayments(
        undefined,
        0,
        10,
        'createdAt',
        'desc',
        'month',
      );

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { subscriptionType: { contains: 'month', mode: 'insensitive' } },
              { status: { contains: 'month', mode: 'insensitive' } },
              { paymentProvider: { contains: 'month', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination and sorting', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllPayments(undefined, 10, 5, 'amount', 'asc');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
          orderBy: { amount: 'asc' },
        }),
      );
    });

    it('should return empty result when no payments', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      const result = await repository.findAllPayments();

      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
