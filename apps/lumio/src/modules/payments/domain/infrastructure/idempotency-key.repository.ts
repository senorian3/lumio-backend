import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IdempotencyKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(messageId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.idempotencyKey.findUnique({
      where: { id: messageId },
    });
  }

  async upsert(
    messageId: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.idempotencyKey.upsert({
      where: { id: messageId },
      update: { expiresAt },
      create: { id: messageId, expiresAt },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
