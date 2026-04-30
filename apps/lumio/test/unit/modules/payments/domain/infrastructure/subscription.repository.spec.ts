import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

describe('SubscriptionRepository', () => {
  let repository: SubscriptionRepository;

  const mockPrisma = {
    subscription: {
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(SubscriptionRepository);
    jest.clearAllMocks();
  });

  describe('updateSubscriptionWithNewPayment', () => {
    it('should update subscription with new payment data', async () => {
      const mockSubscription = {
        id: 1,
        subscriptionId: 'sub_123',
        durationType: 'monthly',
      };
      mockPrisma.subscription.update.mockResolvedValue(mockSubscription);

      const result = await repository.updateSubscriptionWithNewPayment(
        1,
        'monthly',
        new Date(),
        'sub_123',
      );

      expect(result).toEqual(mockSubscription);
    });

    it('should use transaction client when provided', async () => {
      const tx = { subscription: { update: jest.fn().mockResolvedValue({}) } };

      await repository.updateSubscriptionWithNewPayment(
        1,
        'monthly',
        new Date(),
        'sub_123',
        tx,
      );

      expect(tx.subscription.update).toHaveBeenCalled();
      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const data = {
        subscriptionId: 'sub_123',
        durationType: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        userProfileId: 1,
      };
      mockPrisma.subscription.create.mockResolvedValue({ id: 1, ...data });

      const result = await repository.createSubscription(data);

      expect(result).toEqual({ id: 1, ...data });
    });

    it('should create subscription with autoRenewal', async () => {
      const data = {
        subscriptionId: 'sub_123',
        durationType: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        userProfileId: 1,
        autoRenewal: true,
      };
      mockPrisma.subscription.create.mockResolvedValue({ id: 1, ...data });

      const result = await repository.createSubscription(data);

      expect(result).toEqual({ id: 1, ...data });
    });
  });

  describe('findSubscriptionByProfileId', () => {
    it('should find subscription by profile id', async () => {
      const mockSubscription = { id: 1, userProfileId: 1 };
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await repository.findSubscriptionByProfileId(1);

      expect(result).toEqual(mockSubscription);
    });

    it('should return null when subscription not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      const result = await repository.findSubscriptionByProfileId(999);

      expect(result).toBeNull();
    });
  });

  describe('updateAutoRenewalById', () => {
    it('should update auto renewal', async () => {
      mockPrisma.subscription.update.mockResolvedValue({});

      await repository.updateAutoRenewalById('sub_123', true);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub_123' },
        data: { autoRenewal: true },
      });
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription', async () => {
      mockPrisma.subscription.delete.mockResolvedValue({ id: 1 });

      const result = await repository.deleteSubscription('sub_123');

      expect(result).toEqual({ id: 1 });
    });

    it('should use transaction client when provided', async () => {
      const tx = { subscription: { delete: jest.fn().mockResolvedValue({}) } };

      await repository.deleteSubscription('sub_123', tx);

      expect(tx.subscription.delete).toHaveBeenCalled();
    });
  });

  describe('findSubscriptionsExpiring', () => {
    it('should find subscriptions expiring soon', async () => {
      const mockSubscriptions = [
        { id: 1, subscriptionId: 'sub_123', userProfile: { userId: 1 } },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await repository.findSubscriptionsExpiring(24, true);

      expect(result).toEqual(mockSubscriptions);
    });

    it('should find subscriptions expiring in days', async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await repository.findSubscriptionsExpiring(
        7,
        true,
        'days',
      );

      expect(result).toEqual([]);
    });
  });
});
