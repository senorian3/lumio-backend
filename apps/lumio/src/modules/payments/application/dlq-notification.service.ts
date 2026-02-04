import { Injectable } from '@nestjs/common';

@Injectable()
export class DlqNotificationService {
  async sendNotification(
    messageId: string,
    routingKey: string,
    error: string,
    retryCount: number,
  ): Promise<void> {
    // По факту ничего не делаем, только логируем
    console.log(`[DLQ Notification Service] Message ${messageId} went to DLQ`);
    console.log(
      `[DLQ Notification Service] Details: ${routingKey}, ${error}, ${retryCount} retries`,
    );

    // Здесь могла бы быть реальная логика:
    // - Отправка в Slack
    // - Отправка email
    // - Создание тикета
    // - Запись в мониторинг
  }
}
