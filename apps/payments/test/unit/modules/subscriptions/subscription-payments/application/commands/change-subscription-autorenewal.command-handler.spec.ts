import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ChangeAutoRenewalSubscriptionTransferDto } from '@libs/dto/transfer/change-autorenewal-subscription.transfer.dto';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import {
  ChangeAutoRenewalSubscriptionCommandHandler,
  ChangeAutoRenewalSubscriptionCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/change-subscription-autorenewal.command-handler';

describe('ChangeAutoRenewalSubscriptionCommandHandler', () => {
  let handler: ChangeAutoRenewalSubscriptionCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockPrisma: any;
  let mockOutboxService: jest.Mocked<OutboxService>;

  const mockDto: ChangeAutoRenewalSubscriptionTransferDto = {
    profileId: '1',
    autoRenewal: false,
  };

  const mockActiveSubscription = {
    subscriptionId: 'sub_123',
    customPaymentId: 'payment_123',
    autoRenewal: true,
    subscriptionType: '1 month',
    profileId: 1,
  };

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeAutoRenewalSubscriptionCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findActiveSubscriptionByProfileId: jest.fn(),
            updatePaymentAutoRenewal: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: OutboxService,
          useValue: {
            createChangeSubscriptionAutoRenewalStripe: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ChangeAutoRenewalSubscriptionCommandHandler>(
      ChangeAutoRenewalSubscriptionCommandHandler,
    );
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockLogger = module.get(AppLoggerService);
    mockOutboxService = module.get(OutboxService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should change auto renewal successfully', async () => {
      // Arrange
      const command = new ChangeAutoRenewalSubscriptionCommand(mockDto);

      mockPaymentsRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockActiveSubscription as any,
      );
      mockPaymentsRepository.updatePaymentAutoRenewal.mockResolvedValue(
        undefined,
      );
      mockOutboxService.createChangeSubscriptionAutoRenewalStripe.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockPaymentsRepository.updatePaymentAutoRenewal,
      ).toHaveBeenCalledWith(
        mockActiveSubscription.subscriptionId,
        mockActiveSubscription.customPaymentId,
        mockDto.autoRenewal,
        mockPrisma,
      );
      expect(
        mockOutboxService.createChangeSubscriptionAutoRenewalStripe,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when no active subscription', async () => {
      // Arrange
      const command = new ChangeAutoRenewalSubscriptionCommand(mockDto);

      mockPaymentsRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should return early when autoRenewal is the same', async () => {
      // Arrange
      const command = new ChangeAutoRenewalSubscriptionCommand({
        ...mockDto,
        autoRenewal: true,
      });

      mockPaymentsRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockActiveSubscription as any,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(
        mockPaymentsRepository.updatePaymentAutoRenewal,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when database fails', async () => {
      // Arrange
      const command = new ChangeAutoRenewalSubscriptionCommand(mockDto);
      const dbError = new Error('Database error');

      mockPaymentsRepository.findActiveSubscriptionByProfileId.mockResolvedValue(
        mockActiveSubscription as any,
      );
      mockPaymentsRepository.updatePaymentAutoRenewal.mockRejectedValue(
        dbError,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(dbError);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
