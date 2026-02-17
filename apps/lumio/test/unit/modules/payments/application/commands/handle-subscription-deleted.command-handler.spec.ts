import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import {
  HandleSubscriptionDeletedCommandHandler,
  HandleSubscriptionDeletedCommand,
} from '@lumio/modules/payments/application/commands/handle-subscription-deleted.command-handler';
import { SubscriptionDeletedEvent } from '@lumio/modules/payments/api/dto/transfer/subscription-deleted-event.dto';

describe('HandleSubscriptionDeletedCommandHandler', () => {
  let handler: HandleSubscriptionDeletedCommandHandler;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleSubscriptionDeletedCommandHandler,
        {
          provide: SubscriptionRepository,
          useValue: {
            findSubscriptionById: jest.fn(),
            cancelSubscription: jest.fn(),
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

      mockSubscriptionRepository.findSubscriptionById.mockResolvedValue(
        mockSubscription,
      );
      mockSubscriptionRepository.cancelSubscription.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findSubscriptionById,
      ).toHaveBeenCalledWith('sub-123');
      expect(
        mockSubscriptionRepository.cancelSubscription,
      ).toHaveBeenCalledWith('sub-123', expect.any(Date));
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

      mockSubscriptionRepository.findSubscriptionById.mockResolvedValue(null);

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockSubscriptionRepository.findSubscriptionById,
      ).toHaveBeenCalledWith('sub-not-found');
      expect(
        mockSubscriptionRepository.cancelSubscription,
      ).not.toHaveBeenCalled();
    });

    it('should handle database error when finding subscription', async () => {
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

      mockSubscriptionRepository.findSubscriptionById.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });

    it('should handle database error when canceling subscription', async () => {
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

      mockSubscriptionRepository.findSubscriptionById.mockResolvedValue(
        mockSubscription,
      );
      mockSubscriptionRepository.cancelSubscription.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });
  });
});
