import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQSetupService } from '@payments/core/rabbitmq-setup.service';
import { CoreConfig } from '@payments/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

import amqp from 'amqplib';

describe('RabbitMQSetupService', () => {
  let service: RabbitMQSetupService;
  let coreConfig: { rmqUrl: string };
  let logger: { error: jest.Mock; warn: jest.Mock; log: jest.Mock };
  let mockChannel: {
    assertExchange: jest.Mock;
    assertQueue: jest.Mock;
    bindQueue: jest.Mock;
    close: jest.Mock;
  };
  let mockConnection: {
    createChannel: jest.Mock;
    close: jest.Mock;
  };

  beforeEach(async () => {
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    };

    coreConfig = { rmqUrl: 'amqp://localhost:5672' };
    logger = { error: jest.fn(), warn: jest.fn(), log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQSetupService,
        {
          provide: CoreConfig,
          useValue: coreConfig,
        },
        {
          provide: AppLoggerService,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<RabbitMQSetupService>(RabbitMQSetupService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupBindings', () => {
    it('should setup all exchanges, queues and bindings', async () => {
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.setupBindings();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createChannel).toHaveBeenCalled();

      // DLX exchange and queue
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'dlx_payments_exchange',
        'direct',
        { durable: true },
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'dlq_payments_queue',
        { durable: true },
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'dlq_payments_queue',
        'dlx_payments_exchange',
        'dlq.payments',
      );

      // Main exchange and queue
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'sub_payments_exchange',
        'topic',
        { durable: true },
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'lumio_to_payments_queue',
        {
          durable: true,
          deadLetterExchange: 'dlx_payments_exchange',
          deadLetterRoutingKey: 'dlq.payments',
          messageTtl: 300000,
        },
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'lumio_to_payments_queue',
        'sub_payments_exchange',
        'lumio.#',
      );

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle connection error gracefully', async () => {
      const error = new Error('Connection refused');
      (amqp.connect as jest.Mock).mockRejectedValue(error);

      await service.setupBindings();

      expect(logger.error).toHaveBeenCalledWith(
        'Connection refused',
        error.stack,
        RabbitMQSetupService.name,
      );
    });

    it('should handle channel creation error gracefully', async () => {
      const error = new Error('Channel error');
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
      mockConnection.createChannel.mockRejectedValue(error);

      await service.setupBindings();

      expect(logger.error).toHaveBeenCalledWith(
        'Channel error',
        error.stack,
        RabbitMQSetupService.name,
      );
    });

    it('should handle exchange assertion error gracefully', async () => {
      const error = new Error('Exchange error');
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
      mockChannel.assertExchange.mockRejectedValue(error);

      await service.setupBindings();

      expect(logger.error).toHaveBeenCalledWith(
        'Exchange error',
        error.stack,
        RabbitMQSetupService.name,
      );
    });
  });

  describe('onModuleInit', () => {
    it('should call setupBindings on module init', async () => {
      (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

      await service.onModuleInit();

      expect(mockConnection.createChannel).toHaveBeenCalled();
    });
  });
});
