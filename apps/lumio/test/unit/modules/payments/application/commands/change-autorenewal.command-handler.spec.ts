import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PaymentsHttpAdapter } from '@lumio/modules/payments/application/payments-http.adapter';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import {
  ChangeAutoRenewalCommandHandler,
  ChangeAutoRenewalCommand,
} from '@lumio/modules/payments/application/commands/change-autorenewal.command.handler';

describe('ChangeAutoRenewalCommandHandler', () => {
  let handler: ChangeAutoRenewalCommandHandler;
  let mockPaymentsHttpAdapter: jest.Mocked<PaymentsHttpAdapter>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;

  const mockUserId = 1;
  const mockProfileId = 1;

  const mockDto = new InputChangeAutorenewalSubscriptionDto();
  mockDto.profileId = '1';
  mockDto.autoRenewal = false;

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
    id: 'sub-123',
    durationType: 'monthly',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-02-01'),
    autoRenewal: true,
    cancelledAt: null,
    userProfileId: mockProfileId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeAutoRenewalCommandHandler,
        {
          provide: PaymentsHttpAdapter,
          useValue: {
            updateAutoRenewal: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            getProfileById: jest.fn(),
            getProfileByUserId: jest.fn(),
          },
        },
        {
          provide: SubscriptionRepository,
          useValue: {
            findActiveSubscriptionByProfileId: jest.fn(),
            updateAutoRenewalById: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ChangeAutoRenewalCommandHandler>(
      ChangeAutoRenewalCommandHandler,
    );
    mockPaymentsHttpAdapter = module.get(PaymentsHttpAdapter);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockSubscriptionRepository = module.get(SubscriptionRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should change auto renewal successfully', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPaymentsHttpAdapter.updateAutoRenewal.mockResolvedValue(undefined);
      mockSubscriptionRepository.updateAutoRenewalById.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockProfileId);
      expect(
        mockExternalQueryUserRepository.getProfileByUserId,
      ).toHaveBeenCalledWith(mockUserId);
      expect(
        mockSubscriptionRepository.findActiveSubscriptionByProfileId,
      ).toHaveBeenCalledWith(mockProfileId);
      expect(mockPaymentsHttpAdapter.updateAutoRenewal).toHaveBeenCalled();
      expect(
        mockSubscriptionRepository.updateAutoRenewalById,
      ).toHaveBeenCalledWith('sub-123', false);
    });

    it('should throw NotFoundDomainException when profile does not exist', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe('Profile does not exist');
        expect(error.extensions[0]?.field).toBe('profileId');
      }
    });

    it('should throw ForbiddenDomainException when user has no profile', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Forbidden');
        expect(error.extensions[0]?.message).toBe('User has no profile');
        expect(error.extensions[0]?.field).toBe('userId');
      }
    });

    it('should throw ForbiddenDomainException when user tries to change another user profile', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);
      const otherProfile = { ...mockProfile, id: 999 };

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        otherProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        ForbiddenDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Forbidden');
        expect(error.extensions[0]?.message).toBe(
          'User cannot change autorenewal for another user',
        );
        expect(error.extensions[0]?.field).toBe('profileId');
      }
    });

    it('should throw NotFoundDomainException when subscription not found', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        NotFoundDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Not Found');
        expect(error.extensions[0]?.message).toBe(
          'User has no active subscription',
        );
        expect(error.extensions[0]?.field).toBe('profileId');
      }
    });

    it('should return early when autoRenewal is same', async () => {
      // Arrange
      const sameDto = new InputChangeAutorenewalSubscriptionDto();
      sameDto.profileId = '1';
      sameDto.autoRenewal = true;

      const command = new ChangeAutoRenewalCommand(mockUserId, sameDto);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPaymentsHttpAdapter.updateAutoRenewal).not.toHaveBeenCalled();
      expect(
        mockSubscriptionRepository.updateAutoRenewalById,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when payment adapter fails', async () => {
      // Arrange
      const command = new ChangeAutoRenewalCommand(mockUserId, mockDto);
      const paymentError = new Error('Payment service unavailable');

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockExternalQueryUserRepository.getProfileByUserId.mockResolvedValue(
        mockProfile,
      );
      mockSubscriptionRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockSubscription,
      );
      mockPaymentsHttpAdapter.updateAutoRenewal.mockRejectedValue(paymentError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(paymentError);
    });
  });
});
