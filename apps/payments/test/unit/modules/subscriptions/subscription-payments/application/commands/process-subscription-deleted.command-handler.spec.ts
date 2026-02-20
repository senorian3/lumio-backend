import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { OutboxService } from '@payments/modules/subscriptions/outbox/application/outbox.service';
import { PrismaService } from '@payments/prisma/prisma.service';
import { RetryService } from '@payments/modules/subscriptions/subscription-payments/application/retry.service';
import { ManualReviewService } from '@payments/modules/subscriptions/subscription-payments/application/manual-review.service';
import {
  ProcessSubscriptionDeletedCommandHandler,
  ProcessSubscriptionDeletedCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/process-subscription-deleted.command-handler';
import Stripe from 'stripe';

describe('ProcessSubscriptionDeletedCommandHandler', () => {
  let handler: ProcessSubscriptionDeletedCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockOutboxService: jest.Mocked<OutboxService>;
  let mockPrisma: any;
  let mockRetryService: jest.Mocked<RetryService>;
  let mockManualReviewService: jest.Mocked<ManualReviewService>;

  const mockEvent = {
    id: 'evt_123',
    data: {
      object: {
        id: 'sub_123',
      },
    },
    created: Date.now() / 1000,
  } as unknown as Stripe.Event;

  const mockPayment = {
    subscriptionId: 'sub_123',
    profileId: 1,
    customPaymentId: 'payment_123',
  };

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessSubscriptionDeletedCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findBySubscriptionId: jest.fn(),
            cancelPayment: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
          },
        },
        {
          provide: OutboxService,
          useValue: {
            createSubscriptionDeletedMessage: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: RetryService,
          useValue: {
            executeWithRetry: jest.fn((fn) => fn()),
          },
        },
        {
          provide: ManualReviewService,
          useValue: {
            createFailedSubscriptionDeletedTask: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ProcessSubscriptionDeletedCommandHandler>(
      ProcessSubscriptionDeletedCommandHandler,
    );
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockLogger = module.get(AppLoggerService);
    mockOutboxService = module.get(OutboxService);
    mockRetryService = module.get(RetryService);
    mockManualReviewService = module.get(ManualReviewService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should process subscription deleted successfully', async () => {
      // Arrange
      const command = new ProcessSubscriptionDeletedCommand(mockEvent);

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockPayment as any,
      );
      mockPaymentsRepository.cancelPayment.mockResolvedValue(undefined);
      mockOutboxService.createSubscriptionDeletedMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await handler.execute(command);

      // Assert
      expect(mockPaymentsRepository.findBySubscriptionId).toHaveBeenCalledWith(
        'sub_123',
      );
      expect(mockPaymentsRepository.cancelPayment).toHaveBeenCalled();
      expect(
        mockOutboxService.createSubscriptionDeletedMessage,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequestDomainException when payment not found', async () => {
      // Arrange
      const command = new ProcessSubscriptionDeletedCommand(mockEvent);

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(null);
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw new Error('Payment not found');
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );
    });

    it('should handle database error', async () => {
      // Arrange
      const command = new ProcessSubscriptionDeletedCommand(mockEvent);
      const dbError = new Error('Database error');

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw dbError;
      });
      mockManualReviewService.createFailedSubscriptionDeletedTask.mockResolvedValue(
        undefined,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(
        mockManualReviewService.createFailedSubscriptionDeletedTask,
      ).toHaveBeenCalled();
    });

    it('should handle manual review service error', async () => {
      // Arrange
      const command = new ProcessSubscriptionDeletedCommand(mockEvent);
      const processError = new Error('Processing error');

      mockPaymentsRepository.findBySubscriptionId.mockResolvedValue(
        mockPayment as any,
      );
      mockRetryService.executeWithRetry.mockImplementation(async () => {
        throw processError;
      });
      mockManualReviewService.createFailedSubscriptionDeletedTask.mockRejectedValue(
        new Error('Manual review error'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestDomainException,
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
