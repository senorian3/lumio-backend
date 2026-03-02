import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RmqContext } from '@nestjs/microservices';
import { DlqNotificationService } from './dlq-notification.service';
import { IdempotencyKeyRepository } from '../domain/infrastructure/idempotency-key.repository';
import { PrismaService } from '@lumio/prisma/prisma.service';

@Injectable()
export class MessageProcessingService {
  private readonly MAX_RETRIES = 3;
  private readonly TTL_SECONDS = 86400;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly dlqNotificationService: DlqNotificationService,
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository,
    private readonly prisma: PrismaService,
  ) {}

  async processMessage(
    eventName: string,
    data: any,
    context: RmqContext,
    command: any,
    messageIdPrefix: string,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    let messageId = originalMsg.properties.messageId;
    if (!messageId && data && typeof data === 'object' && data._messageId) {
      messageId = data._messageId;
    }
    if (!messageId) {
      messageId = `${messageIdPrefix}-${Date.now()}`;
    }

    let shouldAck = false;

    try {
      await this.prisma.$transaction(async (tx) => {
        const existing = await this.idempotencyKeyRepository.findById(
          messageId,
          tx,
        );

        if (existing && existing.expiresAt > new Date()) {
          // shouldAck = true; // Важно: подтверждаем сообщение, даже если оно уже обработано
          return;
        }

        const expiresAt = new Date(Date.now() + this.TTL_SECONDS * 1000);

        await this.idempotencyKeyRepository.upsert(messageId, expiresAt, tx);

        await this.commandBus.execute(command);

        shouldAck = true;
      });

      if (shouldAck) {
        channel.ack(originalMsg);
      }
    } catch (error) {
      let retryCount = originalMsg.properties.headers?.['x-retry-count'] || 0;
      if (
        !retryCount &&
        data &&
        typeof data === 'object' &&
        data._retryCount !== undefined
      ) {
        retryCount = data._retryCount;
      }

      if (retryCount >= this.MAX_RETRIES) {
        channel.nack(originalMsg, false, false);

        await this.dlqNotificationService.sendNotification(
          messageId,
          eventName,
          error.message,
          retryCount,
        );
      } else {
        if (!originalMsg.properties.headers) {
          originalMsg.properties.headers = {};
        }
        originalMsg.properties.headers['x-retry-count'] = retryCount + 1;
        channel.nack(originalMsg, false, true);
      }
    }
  }
}
