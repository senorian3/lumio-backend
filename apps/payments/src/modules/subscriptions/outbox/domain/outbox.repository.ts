import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import { OutboxMessage } from 'generated/prisma-payments';
import {
  OutboxAggregateType,
  OutboxEventType,
  OutboxMessageStatus,
} from '../../constants/outbox-constants';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOutboxMessage(
    data: {
      aggregateId: number;
      aggregateType: OutboxAggregateType;
      eventType: OutboxEventType;
      payload: any;
      scheduledAt?: Date;
      ttl?: Date;
    },
    tx?: any,
  ): Promise<OutboxMessage> {
    const client = tx || this.prisma;
    return client.outboxMessage.create({
      data: {
        aggregateId: data.aggregateId,
        aggregateType: data.aggregateType,
        eventType: data.eventType,
        payload: data.payload,
        scheduledAt: data.scheduledAt || new Date(),
        ttl: data.ttl,
      },
    });
  }

  async findPendingMessages(limit: number): Promise<OutboxMessage[]> {
    return this.prisma.outboxMessage.findMany({
      where: {
        status: OutboxMessageStatus.PENDING,
        scheduledAt: { lte: new Date() },
        retryCount: { lt: 3 },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
    });
  }

  async markAsProcessing(messageId: number): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: messageId },
      data: {
        status: OutboxMessageStatus.PROCESSING,
        scheduledAt: new Date(),
      },
    });
  }

  async markAsCompleted(
    messageId: number,
    details: string,
    processedAt: Date,
  ): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: messageId },
      data: {
        status: OutboxMessageStatus.COMPLETED,
        processedAt,
        details,
      },
    });
  }

  async incrementRetryCount(messageId: number): Promise<void> {
    await this.prisma.outboxMessage.update({
      where: { id: messageId },
      data: {
        retryCount: { increment: 1 },
        scheduledAt: new Date(Date.now() + 10000), // Retry after 10 seconds
      },
    });
  }

  async cleanupExpiredMessages(): Promise<void> {
    await this.prisma.outboxMessage.deleteMany({
      where: {
        ttl: { lt: new Date() },
      },
    });
  }

  async findMessageById(messageId: number): Promise<OutboxMessage | null> {
    return this.prisma.outboxMessage.findUnique({
      where: { id: messageId },
    });
  }
}
