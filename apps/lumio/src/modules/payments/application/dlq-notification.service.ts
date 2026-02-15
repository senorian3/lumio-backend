import { Injectable } from '@nestjs/common';

@Injectable()
export class DlqNotificationService {
  async sendNotification(
    messageId: string,
    routingKey: string,
    error: string,
    retryCount: number,
  ): Promise<void> {
    console.log(`[DLQ Notification Service] Message ${messageId} went to DLQ`);
    console.log(
      `[DLQ Notification Service] Details: ${routingKey}, ${error}, ${retryCount} retries`,
    );
  }
}
