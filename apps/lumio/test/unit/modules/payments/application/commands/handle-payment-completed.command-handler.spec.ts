import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from '@libs/logger/logger.service';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import {
  HandlePaymentCompletedCommandHandler,
  HandlePaymentCompletedCommand,
} from '@lumio/modules/payments/application/commands/handle-payment-completed.command-handler';
import { PaymentCompletedEvent } from '@lumio/modules/payments/api/dto/transfer/payment-completed-event.dto';

describe('HandlePaymentCompletedCommandHandler', () => {
  let handler: HandlePaymentCompletedCommandHandler;
  let mockSubscriptionRepository: jest.Mocked<SubscriptionRepository>;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockExternalQueryUserRepository: jest.Mocked<ExternalQueryUserAccountsRepository>;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockLogger: jest.Mocked<AppLoggerService>;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandlePaymentCompletedCommandHandler,
        {
          provide: SubscriptionRepository,
          useValue: {
            createSubscription: jest.fn(),
          },
        },
        {
          provide: PaymentsRepository,
          useValue: {
            createPayment: jest.fn(),
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
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockExternalQueryUserRepository = module.get(
      ExternalQueryUserAccountsRepository,
    );
    mockPrisma = module.get(PrismaService);
    mockLogger = module.get(AppLoggerService);
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
      mockPrisma.$transaction.mockImplementation(async () => {
        await mockSubscriptionRepository.createSubscription(
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
        await mockPaymentsRepository.createPayment(
          expect.any(Object),
          expect.anything(),
        );
        await mockExternalQueryUserRepository.updateAccountType(
          mockProfileId,
          'Business',
          expect.anything(),
        );
        return undefined;
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockExternalQueryUserRepository.getProfileById,
      ).toHaveBeenCalledWith(mockProfileId);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when profile not found', async () => {
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
        BadRequestDomainException,
      );

      try {
        await handler.execute(command);
        fail('Should have thrown an exception');
      } catch (error: any) {
        expect(error.message).toBe('Bad Request');
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
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
