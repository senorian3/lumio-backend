import { Test, TestingModule } from '@nestjs/testing';
import { DlqNotificationService } from '@lumio/modules/payments/application/dlq-notification.service';
import { AppLoggerService } from '@libs/logger/logger.service';

describe('DlqNotificationService', () => {
  let service: DlqNotificationService;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DlqNotificationService,
        {
          provide: AppLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DlqNotificationService>(DlqNotificationService);
    mockLogger = module.get(AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should log DLQ message with all parameters', async () => {
      const messageId = 'msg_123';
      const routingKey = 'payment.completed';
      const error = 'Processing failed';
      const retryCount = 3;

      await service.sendNotification(messageId, routingKey, error, retryCount);

      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(messageId),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(routingKey),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(error),
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining(retryCount.toString()),
      );
    });
  });
});
