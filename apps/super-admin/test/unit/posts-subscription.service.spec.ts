import { Test, TestingModule } from '@nestjs/testing';
import { PostsSubscriptionService } from '@super-admin/modules/posts/application/posts-subscription.service';
import { CoreConfig } from '@super-admin/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('PostsSubscriptionService', () => {
  let service: PostsSubscriptionService;

  const mockCoreConfig = {
    rmqUrl: 'amqp://localhost:5672',
  };

  const mockLogger = {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsSubscriptionService,
        {
          provide: CoreConfig,
          useValue: mockCoreConfig,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PostsSubscriptionService>(PostsSubscriptionService);

    // Mock the private connectToRabbitMQ method to prevent real TCP connections
    jest
      .spyOn(service as any, 'connectToRabbitMQ')
      .mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // Ensure any connections are closed
    await service.onModuleDestroy();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have pubSub instance', () => {
    expect(service.pubSub).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should be defined and callable', async () => {
      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should handle disconnect gracefully when channel is null', async () => {
      // Service has no connection/channel initialized
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
      expect(mockLogger.log).toHaveBeenCalledWith(
        'PostsSubscriptionService disconnected from RabbitMQ',
      );
    });

    it('should log error when disconnect fails', async () => {
      // Mock internal state to simulate an error
      const mockChannel = {
        close: jest.fn().mockRejectedValue(new Error('Channel close error')),
      };

      // Access private property for testing
      (service as any).channel = mockChannel;

      await service.onModuleDestroy();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to disconnect from RabbitMQ'),
        expect.any(String),
      );
    });
  });
});
