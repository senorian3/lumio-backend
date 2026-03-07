import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import {
  GetUserSubscriptionQueryHandler,
  GetUserSubscriptionQuery,
} from '@lumio/modules/payments/application/queries/get-user-subscription.query-handler';

describe('GetUserSubscriptionQueryHandler', () => {
  let handler: GetUserSubscriptionQueryHandler;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;

  const mockUserId = 1;
  const mockProfileId = 1;

  const mockProfile = {
    id: mockProfileId,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-01'),
    country: 'USA',
    city: 'New York',
    aboutMe: 'Test user',
    avatarUrl: null,
    profileFilled: true,
    profileFilledAt: new Date(),
    profileUpdatedAt: new Date(),
    accountType: 'free',
    userId: mockUserId,
    user: {} as any,
  };

  const mockSubscription = {
    id: 1,
    subscriptionId: 'sub-123',
    accountType: 'Business',
    durationType: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-02-01'),
    autoRenewal: true,
    cancelledAt: null,
    userProfileId: mockProfileId,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserSubscriptionQueryHandler,
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: SubscriptionRepository,
          useValue: {
            findSubscriptionByProfileId: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUserSubscriptionQueryHandler>(
      GetUserSubscriptionQueryHandler,
    );
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockSubscriptionRepository = module.get(SubscriptionRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return user subscription successfully', async () => {
      // Arrange
      const query = new GetUserSubscriptionQuery(mockUserId);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileByUserId,
      ).toHaveBeenCalledWith(mockUserId);
      expect(
        mockSubscriptionRepository.findSubscriptionByProfileId,
      ).toHaveBeenCalledWith(mockProfileId);
      expect(result).toEqual({
        id: mockSubscription.subscriptionId,
        accountType: 'Business',
        durationType: mockSubscription.durationType,
        endDate: mockSubscription.endDate,
        nextPaymentDate: mockSubscription.endDate,
        autoRenewal: mockSubscription.autoRenewal,
      });
    });

    it('should throw NotFoundDomainException when profile not found', async () => {
      // Arrange
      const query = new GetUserSubscriptionQuery(mockUserId);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Profile not found');
        expect(error.extensions[0]?.field).toBe('profile');
      }
    });

    it('should throw NotFoundDomainException when subscription not found', async () => {
      // Arrange
      const query = new GetUserSubscriptionQuery(mockUserId);

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findSubscriptionByProfileId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(query);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe(
          "User doesn't have active subscription",
        );
        expect(error.extensions[0]?.field).toBe('userId');
      }
    });

    it('should handle database error when finding profile', async () => {
      // Arrange
      const query = new GetUserSubscriptionQuery(mockUserId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileByUserId.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
    });

    it('should handle database error when finding subscription', async () => {
      // Arrange
      const query = new GetUserSubscriptionQuery(mockUserId);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findSubscriptionByProfileId.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(dbError);
    });
  });
});
