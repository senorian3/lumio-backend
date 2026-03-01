import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessingService } from '@lumio/modules/payments/application/message-processing.service';
import { CommandBus } from '@nestjs/cqrs';
import { DlqNotificationService } from '@lumio/modules/payments/application/dlq-notification.service';
import { IdempotencyKeyRepository } from '@lumio/modules/payments/domain/infrastructure/idempotency-key.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { RmqContext } from '@nestjs/microservices';

describe('MessageProcessingService', () => {
  let service: MessageProcessingService;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockDlqNotificationService: jest.Mocked<DlqNotificationService>;
  let mockIdempotencyKeyRepository: jest.Mocked<IdempotencyKeyRepository>;
  let mockPrismaService: jest.Mocked<PrismaService>;

  const mockChannel = {
    ack: jest.fn(),
    nack: jest.fn(),
  };

  const createMockContext = (
    messageId?: string,
    retryCount?: number,
  ): RmqContext => {
    const headers: Record<string, unknown> = {};
    if (retryCount !== undefined) {
      headers['x-retry-count'] = retryCount;
    }

    return {
      getChannelRef: () => mockChannel,
      getMessage: () => ({
        properties: {
          messageId: messageId || undefined,
          headers,
        },
      }),
    } as unknown as RmqContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageProcessingService,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DlqNotificationService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
        {
          provide: IdempotencyKeyRepository,
          useValue: {
            findById: jest.fn(),
            upsert: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessageProcessingService>(MessageProcessingService);
    mockCommandBus = module.get(CommandBus);
    mockDlqNotificationService = module.get(DlqNotificationService);
    mockIdempotencyKeyRepository = module.get(IdempotencyKeyRepository);
    mockPrismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    const eventName = 'payment.completed';
    const data = { paymentId: 'pay_123', _messageId: 'outbox-1-123' };
    const command = { paymentId: 'pay_123' };

    it('should process message successfully and ack', async () => {
      const context = createMockContext('msg_123');

      mockPrismaService.$transaction.mockImplementation(async (fn: any) => {
        await fn({});
      });
      mockIdempotencyKeyRepository.findById.mockResolvedValue(null);
      mockIdempotencyKeyRepository.upsert.mockResolvedValue({} as any);
      mockCommandBus.execute.mockResolvedValue(undefined);

      mockPrismaService.$transaction.mockImplementation(
        async (callback: any) => {
          const tx = {};
          mockIdempotencyKeyRepository.findById.mockResolvedValue(null);
          await callback(tx);
        },
      );

      await service.processMessage(
        eventName,
        data,
        context,
        command,
        'payment',
      );

      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should skip processing for duplicate message (idempotency)', async () => {
      const context = createMockContext('msg_duplicate');

      mockPrismaService.$transaction.mockImplementation(
        async (callback: any) => {
          const tx = {};
          mockIdempotencyKeyRepository.findById.mockResolvedValue({
            id: 'msg_duplicate',
            expiresAt: new Date(Date.now() + 86400000),
          } as any);
          await callback(tx);
        },
      );

      await service.processMessage(
        eventName,
        data,
        context,
        command,
        'payment',
      );

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it('should nack with requeue when error occurs and retries remain', async () => {
      const context = createMockContext('msg_retry', 1);

      mockPrismaService.$transaction.mockRejectedValue(
        new Error('Processing error'),
      );

      await service.processMessage(
        eventName,
        data,
        context,
        command,
        'payment',
      );

      expect(mockChannel.nack).toHaveBeenCalledWith(
        expect.anything(),
        false,
        true,
      );
    });

    it('should nack without requeue and send DLQ notification when max retries exceeded', async () => {
      const context = createMockContext('msg_dlq', 3);

      mockPrismaService.$transaction.mockRejectedValue(
        new Error('Persistent error'),
      );

      await service.processMessage(
        eventName,
        data,
        context,
        command,
        'payment',
      );

      expect(mockChannel.nack).toHaveBeenCalledWith(
        expect.anything(),
        false,
        false,
      );
      expect(mockDlqNotificationService.sendNotification).toHaveBeenCalledWith(
        'msg_dlq',
        eventName,
        'Persistent error',
        3,
      );
    });

    it('should use _messageId from data when messageId is not in properties', async () => {
      const context = createMockContext(undefined);
      const dataWithMessageId = {
        ...data,
        _messageId: 'outbox-msg-456',
        _retryCount: 0,
      };

      mockPrismaService.$transaction.mockImplementation(
        async (callback: any) => {
          const tx = {};
          mockIdempotencyKeyRepository.findById.mockResolvedValue(null);
          await callback(tx);
        },
      );

      await service.processMessage(
        eventName,
        dataWithMessageId,
        context,
        command,
        'payment',
      );

      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should generate messageId when not provided anywhere', async () => {
      const context = createMockContext(undefined);
      const dataWithoutId = { paymentId: 'pay_123' };

      mockPrismaService.$transaction.mockImplementation(
        async (callback: any) => {
          const tx = {};
          mockIdempotencyKeyRepository.findById.mockResolvedValue(null);
          await callback(tx);
        },
      );

      await service.processMessage(
        eventName,
        dataWithoutId,
        context,
        command,
        'payment',
      );

      expect(mockChannel.ack).toHaveBeenCalled();
    });
  });
});
