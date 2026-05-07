import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { PrismaService } from '@payments/prisma/prisma.service';
import { PaymentStatus } from '@payments/modules/subscriptions/constants/stripe-constants';
import { CreatePaymentDomainDto } from '@payments/modules/subscriptions/subscription-payments/domain/dto/create-payment.domain.dto';
import { UpdatePaymentDomainDto } from '@payments/modules/subscriptions/subscription-payments/domain/dto/update-payment.domain.dto';

describe('PaymentsRepository', () => {
  let repository: PaymentsRepository;
  let prisma: {
    payment: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const mockPayment = {
    id: 1,
    customPaymentId: 'cp_123',
    subscriptionId: 'sub_123',
    stripeSubscriptionId: 'stripe_sub_123',
    profileId: 1,
    amount: 9.99,
    currency: 'usd',
    status: 'active',
    autoRenewal: false,
    cancelledAt: null,
    periodEnd: new Date('2026-02-01'),
    nextPaymentDate: new Date('2026-02-01'),
    createdAt: new Date('2026-01-01'),
    stripePaymentCreatedAt: new Date('2026-01-01'),
    paymentProvider: 'stripe',
    subscriptionType: '1_month',
    paymentsUrl: 'https://checkout.stripe.com/test',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsRepository,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<PaymentsRepository>(PaymentsRepository);
    prisma = module.get(PrismaService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      const createData = new CreatePaymentDomainDto(
        'stripe',
        'usd',
        9.99,
        1,
        PaymentStatus.PENDING,
        '1_month',
        null,
        null,
        false,
        null,
        null,
        null,
        null,
        new Date(),
        'https://checkout.stripe.com/test',
        new Date(),
        null,
        'cp_123',
      );

      prisma.payment.create.mockResolvedValue(mockPayment);

      const result = await repository.createPayment(createData);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.create).toHaveBeenCalledWith({ data: createData });
    });

    it('should use transaction client when provided', async () => {
      const createData = new CreatePaymentDomainDto(
        'stripe',
        'usd',
        9.99,
        1,
        PaymentStatus.PENDING,
        '1_month',
        null,
        null,
        false,
        null,
        null,
        null,
        null,
        new Date(),
        'https://checkout.stripe.com/test',
        new Date(),
        null,
        'cp_123',
      );
      const tx = {
        payment: { create: jest.fn().mockResolvedValue(mockPayment) },
      };

      const result = await repository.createPayment(createData, tx);

      expect(result).toEqual(mockPayment);
      expect(tx.payment.create).toHaveBeenCalledWith({ data: createData });
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('findPendingPaymentByProfileId', () => {
    it('should find pending payment by profile id', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await repository.findPendingPaymentByProfileId(1);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          profileId: 1,
          status: PaymentStatus.PENDING,
        },
      });
    });

    it('should return null when no pending payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await repository.findPendingPaymentByProfileId(1);

      expect(result).toBeNull();
    });
  });

  describe('findLastSubscriptionPaymentByStripeSubscriptionId', () => {
    it('should find active payment by stripe subscription id', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result =
        await repository.findLastSubscriptionPaymentByStripeSubscriptionId(
          'stripe_sub_123',
        );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'stripe_sub_123',
          status: PaymentStatus.ACTIVE,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should find extension payment when no active payment', async () => {
      prisma.payment.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockPayment);

      const result =
        await repository.findLastSubscriptionPaymentByStripeSubscriptionId(
          'stripe_sub_123',
        );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          stripeSubscriptionId: 'stripe_sub_123',
          status: PaymentStatus.EXTENSION,
          cancelledAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no payment found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      const result =
        await repository.findLastSubscriptionPaymentByStripeSubscriptionId(
          'stripe_sub_123',
        );

      expect(result).toBeNull();
    });
  });

  describe('updateCustomPaymentId', () => {
    it('should update payment by customPaymentId', async () => {
      const updateData = new UpdatePaymentDomainDto(
        'cp_123',
        'sub_123',
        'stripe_sub_123',
        null,
        'active',
        new Date(),
        new Date(),
        new Date(),
        false,
      );

      prisma.payment.update.mockResolvedValue(mockPayment);

      const result = await repository.updateCustomPaymentId(updateData);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        data: updateData,
      });
    });

    it('should use transaction client when provided', async () => {
      const updateData = new UpdatePaymentDomainDto(
        'cp_123',
        'sub_123',
        'stripe_sub_123',
        null,
        'active',
        new Date(),
        new Date(),
        new Date(),
        false,
      );
      const tx = {
        payment: { update: jest.fn().mockResolvedValue(mockPayment) },
      };

      const result = await repository.updateCustomPaymentId(updateData, tx);

      expect(result).toEqual(mockPayment);
      expect(tx.payment.update).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        data: updateData,
      });
    });
  });

  describe('completePayment', () => {
    it('should complete payment with cancelledAt', async () => {
      const cancelledAt = new Date('2026-01-15');
      prisma.payment.update.mockResolvedValue(mockPayment);

      const result = await repository.completePayment(
        'cp_123',
        'completed',
        cancelledAt,
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        data: {
          status: 'completed',
          autoRenewal: false,
          cancelledAt,
        },
      });
    });
  });

  describe('findByCustomPaymentId', () => {
    it('should find payment by customPaymentId', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await repository.findByCustomPaymentId('cp_123');

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
      });
    });
  });

  describe('findPaymentForIdempotencyCheck', () => {
    it('should find payment for idempotency check', async () => {
      const idempotencyResult = {
        status: 'active',
        stripeSubscriptionId: 'stripe_sub_123',
        subscriptionId: 'sub_123',
      };
      prisma.payment.findUnique.mockResolvedValue(idempotencyResult);

      const result = await repository.findPaymentForIdempotencyCheck('cp_123');

      expect(result).toEqual(idempotencyResult);
      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        select: {
          status: true,
          stripeSubscriptionId: true,
          subscriptionId: true,
        },
      });
    });
  });

  describe('updatePaymentSubscriptionAutoRenewal', () => {
    it('should update autoRenewal', async () => {
      prisma.payment.update.mockResolvedValue(mockPayment);

      await repository.updatePaymentSubscriptionAutoRenewal(
        'sub_123',
        'cp_123',
        true,
      );

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub_123', customPaymentId: 'cp_123' },
        data: { autoRenewal: true },
      });
    });
  });

  describe('findBySubscriptionId', () => {
    it('should find payment by subscriptionId', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await repository.findBySubscriptionId('sub_123');

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub_123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findActiveSubscriptionPaymentByStripeSubscriptionId', () => {
    it('should find active or extension payment', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result =
        await repository.findActiveSubscriptionPaymentByStripeSubscriptionId(
          'stripe_sub_123',
        );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          stripeSubscriptionId: 'stripe_sub_123',
          cancelledAt: null,
          status: {
            in: [PaymentStatus.ACTIVE, PaymentStatus.EXTENSION],
          },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findActiveSubscriptionPaymentByProfileId', () => {
    it('should find active payment by profile id', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result =
        await repository.findActiveSubscriptionPaymentByProfileId(1);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          profileId: 1,
          status: PaymentStatus.ACTIVE,
          cancelledAt: null,
          periodEnd: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findByProfileAndSubscriptionId', () => {
    it('should find payment by profile and subscription id', async () => {
      prisma.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await repository.findByProfileAndSubscriptionId(
        1,
        'sub_123',
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenCalledWith({
        where: {
          profileId: 1,
          subscriptionId: 'sub_123',
        },
      });
    });
  });

  describe('cancelPayment', () => {
    it('should cancel payment', async () => {
      const cancelledAt = new Date('2026-01-15');
      prisma.payment.update.mockResolvedValue(mockPayment);

      const result = await repository.cancelPayment('cp_123', cancelledAt);

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        data: {
          status: PaymentStatus.CANCELLED,
          cancelledAt: cancelledAt,
        },
      });
    });
  });

  describe('deleteExpiredPendingPayments', () => {
    it('should delete expired pending payments', async () => {
      const createdBefore = new Date('2026-01-01');
      prisma.payment.deleteMany.mockResolvedValue({ count: 5 });

      const result =
        await repository.deleteExpiredPendingPayments(createdBefore);

      expect(result).toBe(5);
      expect(prisma.payment.deleteMany).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.PENDING,
          createdAt: { lt: createdBefore },
        },
      });
    });
  });

  describe('updatePaymentSubscriptionPeriodDate', () => {
    it('should update period end and next payment date', async () => {
      const periodEnd = new Date('2026-03-01');
      prisma.payment.update.mockResolvedValue(mockPayment);

      const result = await repository.updatePaymentSubscriptionPeriodDate(
        'cp_123',
        periodEnd,
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { customPaymentId: 'cp_123' },
        data: {
          periodEnd,
          nextPaymentDate: periodEnd,
        },
      });
    });
  });

  describe('findAllUserProfilePayments', () => {
    it('should find all user profile payments with pagination', async () => {
      prisma.payment.findMany.mockResolvedValue([mockPayment]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await repository.findAllUserProfilePayments(
        1,
        1,
        10,
        'date_desc',
      );

      expect(result.payments).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: {
          profileId: 1,
          status: { not: PaymentStatus.PENDING },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should sort by amount_asc', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllUserProfilePayments(1, 1, 10, 'amount_asc');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: 'asc' },
        }),
      );
    });

    it('should sort by amount_desc', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllUserProfilePayments(1, 1, 10, 'amount_desc');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { amount: 'desc' },
        }),
      );
    });

    it('should sort by date_asc', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllUserProfilePayments(1, 1, 10, 'date_asc');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should calculate skip correctly for pagination', async () => {
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.payment.count.mockResolvedValue(0);

      await repository.findAllUserProfilePayments(1, 3, 20, 'date_desc');

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20 = 40
          take: 20,
        }),
      );
    });
  });

  describe('findLastActiveSubscriptionByProfileId', () => {
    it('should find last active subscription by profile id', async () => {
      const nowDate = new Date('2026-02-01');
      const lastPayment = {
        ...mockPayment,
        cancelledAt: null,
      };

      prisma.payment.findFirst
        .mockResolvedValueOnce(lastPayment)
        .mockResolvedValueOnce(mockPayment);

      const result = await repository.findLastActiveSubscriptionByProfileId(
        1,
        nowDate,
        'cp_456',
      );

      expect(result).toEqual(mockPayment);
      expect(prisma.payment.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          profileId: 1,
          status: { in: [PaymentStatus.ACTIVE, PaymentStatus.EXTENSION] },
          cancelledAt: null,
          customPaymentId: { not: 'cp_456' },
          stripeSubscriptionId: { not: null },
          periodEnd: { gt: nowDate },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no last payment found', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      const result = await repository.findLastActiveSubscriptionByProfileId(
        1,
        new Date(),
        'cp_456',
      );

      expect(result).toBeNull();
    });

    it('should return null when last payment is cancelled', async () => {
      const cancelledPayment = {
        ...mockPayment,
        cancelledAt: new Date('2026-01-15'),
      };
      prisma.payment.findFirst.mockResolvedValue(cancelledPayment);

      const result = await repository.findLastActiveSubscriptionByProfileId(
        1,
        new Date(),
        'cp_456',
      );

      expect(result).toBeNull();
      expect(prisma.payment.findFirst).toHaveBeenCalledTimes(1);
    });
  });
});
