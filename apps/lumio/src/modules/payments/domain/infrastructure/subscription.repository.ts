import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Subscription } from 'generated/prisma-lumio';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionById(
    subscriptionId: number,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
  }

  async updateSubscription(
    subscriptionId: number,
    durationType: string,
    endDate: Date,
    autoRenewal: boolean,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { id: subscriptionId },
      data: {
        durationType,
        endDate,
        autoRenewal,
      },
    });
  }
}
