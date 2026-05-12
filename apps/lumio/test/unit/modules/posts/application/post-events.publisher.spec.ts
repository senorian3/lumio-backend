import { Test, TestingModule } from '@nestjs/testing';
import { PostEventsPublisher } from '@lumio/modules/posts/application/post-events.publisher';
import { CoreConfig } from '@lumio/core/core.config';
import { AppLoggerService } from '@libs/logger/logger.service';
import { PostCreatedEvent } from '@lumio/modules/posts/domain/events/post-created.event';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));
import * as amqp from 'amqplib';
const mockedAmqp = jest.mocked(amqp);

describe('PostEventsPublisher', () => {
  let publisher: PostEventsPublisher;
  let mockLogger: jest.Mocked<AppLoggerService>;

  const mockPostCreatedEvent = new PostCreatedEvent(
    'post-123',
    'Test description',
    new Date(),
    null,
    1,
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      isBlocked: false,
    },
    [],
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostEventsPublisher,
        {
          provide: CoreConfig,
          useValue: {
            rmqUrl: 'amqp://localhost:5672',
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

    publisher = module.get<PostEventsPublisher>(PostEventsPublisher);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  describe('publishPostCreated', () => {
    it('should publish post created event successfully', async () => {
      const mockChannel = {
        assertExchange: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn(),
      };
      (publisher as any).channel = mockChannel;

      await publisher.publishPostCreated(mockPostCreatedEvent);

      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        'lumio_events',
        'topic',
        {
          durable: true,
        },
      );
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'lumio_events',
        'post.created',
        expect.any(Buffer),
      );

      const publishedBuffer = mockChannel.publish.mock.calls[0][2];
      const parsedMessage = JSON.parse(publishedBuffer.toString());
      expect(parsedMessage.id).toBe('post-123');
      expect(parsedMessage.description).toBe('Test description');
      expect(parsedMessage.userId).toBe(1);
    });

    it('should not publish when channel is not initialized', async () => {
      (publisher as any).channel = null;

      await publisher.publishPostCreated(mockPostCreatedEvent);

      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log error when publishing fails', async () => {
      const mockChannel = {
        assertExchange: jest
          .fn()
          .mockRejectedValue(new Error('Exchange failed')),
        publish: jest.fn(),
      };
      (publisher as any).channel = mockChannel;

      await publisher.publishPostCreated(mockPostCreatedEvent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish post.created event'),
        expect.any(String),
        PostEventsPublisher.name,
      );
    });
  });

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ on module init', async () => {
      const mockConnection = {
        createChannel: jest.fn().mockResolvedValue({}),
      };
      mockedAmqp.connect.mockResolvedValue(mockConnection);

      await publisher.onModuleInit();

      expect(mockedAmqp.connect).toHaveBeenCalledWith('amqp://localhost:5672');
    });

    it('should log error when connection fails', async () => {
      mockedAmqp.connect.mockRejectedValue(new Error('Connection refused'));

      await publisher.onModuleInit();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect to RabbitMQ'),
        expect.any(String),
        PostEventsPublisher.name,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection on module destroy', async () => {
      const mockChannel = { close: jest.fn().mockResolvedValue(undefined) };
      const mockConnection = { close: jest.fn().mockResolvedValue(undefined) };
      (publisher as any).channel = mockChannel;
      (publisher as any).connection = mockConnection;

      await publisher.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should handle missing channel gracefully', async () => {
      (publisher as any).channel = null;
      (publisher as any).connection = null;

      await publisher.onModuleDestroy();

      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
