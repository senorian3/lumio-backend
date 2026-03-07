import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  HandlePaymentCompletedCommandHandler,
  HandlePaymentCompletedCommand,
} from '@lumio/modules/payments/application/commands/handle-payment-completed.command-handler';
import { PaymentCompletedEvent } from '@lumio/modules/payments/api/dto/transfer/payment-completed-event.dto';
import { AccountType } from '@lumio/modules/payments/constants/payments-constans';

describe('HandlePaymentCompletedCommandHandler', () => {
  let handler: HandlePaymentCompletedCommandHandler;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;

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
    userId: 1,
    user: {} as any,
  };

  const mockPayload = {
    paymentId: 'pay-123',
    profileId: mockProfileId,
    amount: 100,
    currency: 'RUB',
    subscriptionId: 'sub-123',
    subscriptionType: '1 month',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-02-01'),
    timestamp: new Date().toISOString(),
    paymentsService: 'yookassa',
    isExtensionSub: false,
    mainSubscriptionId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandlePaymentCompletedCommandHandler,
        {
          provide: SubscriptionRepository,
          useValue: {
            createSubscription: jest.fn(),
            findSubscriptionByProfileId: jest.fn(),
            updateSubscriptionWithNewPayment: jest.fn(),
          },
        },
        {
          provide: ExternalQueryUserAccountsRepository,
          useValue: {
            getProfileById: jest.fn(),
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
          },
        },
      ],
    }).compile();

    handler = module.get<HandlePaymentCompletedCommandHandler>(
      HandlePaymentCompletedCommandHandler,
    );
    mockSubscriptionRepository = module.get(SubscriptionRepository);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPrisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process payment completed successfully', async () => {
      // Arrange
      const mockEvent = new PaymentCompletedEvent(
        1,
        123,
        'Payment',
        'PaymentCompleted',
        mockPayload,
        new Date(),
      );
      const command = new HandlePaymentCompletedCommand(mockEvent);

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );

      const mockSubscription = {
        id: 1,
        subscriptionId: 'sub-123',
        durationType: '1 month',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
        userProfileId: mockProfileId,
        autoRenewal: true,
        cancelledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      mockSubscriptionRepository.createSubscription.mockResolvedValue(
        mockSubscription as any,
      );

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback(mockPrisma);
        return undefined;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockProfileId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(
        mockSubscriptionRepository.createSubscription,
      ).toHaveBeenCalledWith(
        {
          subscriptionId: 'sub-123',
          durationType: '1 month',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          userProfileId: mockProfileId,
          autoRenewal: true,
        },
        expect.anything(),
      );
      expect(
        mockExternalQueryUserRepository.updateAccountType,
      ).toHaveBeenCalledWith(
        mockProfileId,
        AccountType.BUSINESS,
        expect.anything(),
      );
    });

    it('should throw NotFoundDomainException when profile not found', async () => {
      // Arrange
      const mockEvent = new PaymentCompletedEvent(
        1,
        123,
        'Payment',
        'PaymentCompleted',
        mockPayload,
        new Date(),
      );
      const command = new HandlePaymentCompletedCommand(mockEvent);

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
        expect(error.extensions[0]?.message).toBe('User profile dont exist');
        expect(error.extensions[0]?.field).toBe('profileId');
      }
    });

    it('should handle database error when processing payment', async () => {
      // Arrange
      const mockEvent = new PaymentCompletedEvent(
        1,
        123,
        'Payment',
        'PaymentCompleted',
        mockPayload,
        new Date(),
      );
      const command = new HandlePaymentCompletedCommand(mockEvent);
      const dbError = new Error('Database connection failed');

      mockExternalQueryUserRepository.getProfileById.mockResolvedValue(
        mockProfile,
      );
      mockPrisma.$transaction.mockRejectedValue(dbError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);
    });
  });
});
