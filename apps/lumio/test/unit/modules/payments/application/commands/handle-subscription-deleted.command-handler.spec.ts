import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import {
  HandleSubscriptionDeletedCommandHandler,
  HandleSubscriptionDeletedCommand,
} from '@lumio/modules/payments/application/commands/handle-subscription-deleted.command-handler';
import { SubscriptionDeletedEvent } from '@lumio/modules/payments/api/dto/transfer/subscription-deleted-event.dto';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { AccountType } from '@lumio/modules/payments/constants/payments-constans';

describe('HandleSubscriptionDeletedCommandHandler', () => {
  let handler: HandleSubscriptionDeletedCommandHandler;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let mockUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleSubscriptionDeletedCommandHandler,
        {
          provide: SubscriptionRepository,
          useValue: {
            findActiveSubscriptionByProfileId: jest.fn(),
            cancelSubscription: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            updateAccountType: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<HandleSubscriptionDeletedCommandHandler>(
      HandleSubscriptionDeletedCommandHandler,
    );
    mockSubscriptionRepository = module.get(SubscriptionRepository);
    mockUserRepository = module.get(ExternalQueryUserAccountsRepository);
    mockPrisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should cancel subscription successfully', async () => {
      // Arrange
      const mockPayload = {
        subscriptionId: 'sub-123',
        profileId: 1,
        timestamp: new Date().toISOString(),
      };
      const mockEvent = new SubscriptionDeletedEvent(
        1,
        'aggregate-1',
        'Subscription',
        'SubscriptionDeleted',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionDeletedCommand(mockEvent);

      const mockSubscription = {
        id: 'sub-123',
        durationType: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        autoRenewal: true,
        cancelledAt: null,
        userProfileId: 1,
      };

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback({
          subscriptionRepository: mockSubscriptionRepository,
          userRepository: mockUserRepository,
        } as any);
        return undefined;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findActiveSubscriptionByProfileId,
      ).toHaveBeenCalledWith(1);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(
        mockSubscriptionRepository.cancelSubscription,
      ).toHaveBeenCalledWith('sub-123', expect.any(Date), expect.any(Object));
      expect(mockUserRepository.updateAccountType).toHaveBeenCalledWith(
        1,
        AccountType.PERSONAL,
        expect.any(Object),
      );
    });

    it('should return early when subscription not found', async () => {
      // Arrange
      const mockPayload = {
        subscriptionId: 'sub-not-found',
        profileId: 1,
        timestamp: new Date().toISOString(),
      };
      const mockEvent = new SubscriptionDeletedEvent(
        1,
        'aggregate-1',
        'Subscription',
        'SubscriptionDeleted',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionDeletedCommand(mockEvent);

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        null,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findActiveSubscriptionByProfileId,
      ).toHaveBeenCalledWith(1);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(
        mockSubscriptionRepository.cancelSubscription,
      ).not.toHaveBeenCalled();
      expect(mockUserRepository.updateAccountType).not.toHaveBeenCalled();
    });

    it('should handle database error when processing transaction', async () => {
      // Arrange
      const mockPayload = {
        subscriptionId: 'sub-123',
        profileId: 1,
        timestamp: new Date().toISOString(),
      };
      const mockEvent = new SubscriptionDeletedEvent(
        1,
        'aggregate-1',
        'Subscription',
        'SubscriptionDeleted',
        mockPayload,
        new Date(),
      );
      const command = new HandleSubscriptionDeletedCommand(mockEvent);
      const dbError = new Error('Database connection failed');

      const mockSubscription = {
        id: 'sub-123',
        durationType: 'monthly',
        startDate: new Date(),
        endDate: new Date(),
        autoRenewal: true,
        cancelledAt: null,
        userProfileId: 1,
      };

      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPrisma.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });
  });
});
