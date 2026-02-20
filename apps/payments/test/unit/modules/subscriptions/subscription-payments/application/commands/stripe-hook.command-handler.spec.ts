import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import {
  StripeHookCommandHandler,
  StripeHookCommand,
} from '@payments/modules/subscriptions/subscription-payments/application/commands/stripe-hook.command-handler';
import { PaymentsRepository } from '@payments/modules/subscriptions/subscription-payments/domain/infrastructure/payments.repository';
import { StripeAdapter } from '@payments/modules/subscriptions/subscription-payments/application/stripe.adapter';
import { AppLoggerService } from '@libs/logger/logger.service';
import { StripeEventType } from '@payments/modules/subscriptions/constants/stripe-constants';
import Stripe from 'stripe';

describe('StripeHookCommandHandler', () => {
  let handler: StripeHookCommandHandler;
  let mockPaymentsRepository: jest.Mocked<PaymentsRepository>;
  let mockStripeAdapter: jest.Mocked<StripeAdapter>;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  const mockSignature = 'sig_123';
  const mockRawBody = Buffer.from('test body');

  const mockEvent = {
    id: 'evt_123',
    type: StripeEventType.SESSION_COMPLETED,
    data: {
      object: {
        id: 'cs_test_123',
        payment_status: 'paid',
        subscription: 'sub_123',
        metadata: { customPaymentId: 'payment_123' },
      },
    },
  } as unknown as Stripe.Event;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeHookCommandHandler,
        {
          provide: PaymentsRepository,
          useValue: {
            findByCustomPaymentId: jest.fn(),
          },
        },
        {
          provide: StripeAdapter,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: AppLoggerService,
          useValue: {
            error: jest.fn(),
            log: jest.fn(),
            verbose: jest.fn(),
          },
        },
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<StripeHookCommandHandler>(StripeHookCommandHandler);
    mockPaymentsRepository = module.get(PaymentsRepository);
    mockStripeAdapter = module.get(StripeAdapter);
    mockLogger = module.get(AppLoggerService);
    mockCommandBus = module.get(CommandBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should handle SESSION_COMPLETED event', async () => {
      // Arrange
      const command = new StripeHookCommand(mockSignature, mockRawBody);

      mockStripeAdapter.verify.mockResolvedValue(mockEvent);
      mockPaymentsRepository.findByCustomPaymentId.mockResolvedValue(null);
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockStripeAdapter.verify).toHaveBeenCalledWith(
        mockRawBody,
        mockSignature,
      );
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should handle INVOICE_PAID event', async () => {
      // Arrange
      const invoiceEvent = {
        ...mockEvent,
        type: StripeEventType.INVOICE_PAID,
        data: {
          object: {
            id: 'in_123',
            subscription_details: { subscription: 'sub_123' },
            billing_reason: 'subscription_cycle',
            status: 'paid',
          },
        },
      } as unknown as Stripe.Event;

      const command = new StripeHookCommand(mockSignature, mockRawBody);

      mockStripeAdapter.verify.mockResolvedValue(invoiceEvent);
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should handle CUSTOMER_SUBSCRIPTION_DELETED event', async () => {
      // Arrange
      const deletedEvent = {
        ...mockEvent,
        type: StripeEventType.CUSTOMER_SUBSCRIPTION_DELETED,
        data: {
          object: { id: 'sub_123' },
        },
      } as unknown as Stripe.Event;

      const command = new StripeHookCommand(mockSignature, mockRawBody);

      mockStripeAdapter.verify.mockResolvedValue(deletedEvent);
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should skip unknown event types', async () => {
      // Arrange
      const unknownEvent = {
        ...mockEvent,
        type: 'unknown.event',
      } as unknown as Stripe.Event;

      const command = new StripeHookCommand(mockSignature, mockRawBody);

      mockStripeAdapter.verify.mockResolvedValue(unknownEvent);

      // Act
      await handler.execute(command);

      // Assert
      expect(mockLogger.verbose).toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should throw on verify error', async () => {
      // Arrange
      const command = new StripeHookCommand(mockSignature, mockRawBody);

      mockStripeAdapter.verify.mockRejectedValue(
        new Error('Invalid signature'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Invalid signature',
      );
    });
  });
});
