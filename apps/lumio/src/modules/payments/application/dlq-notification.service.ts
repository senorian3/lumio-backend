import { AppLoggerService } from '@libs/logger/logger.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DlqNotificationService {
  constructor(private readonly logger: AppLoggerService) {}
  async sendNotification(
    messageId: string,
    routingKey: string,
    error: string,
    retryCount: number,
  ): Promise<void> {
    this.logger.log(
      `Dlq message: ${messageId}, routingKey: ${routingKey}, error: ${error}, retryCount: ${retryCount}`,
    );
  }
}
