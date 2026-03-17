import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Subscription } from 'generated/prisma-lumio';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateSubscriptionWithNewPayment(
    userProfileId: number,
    durationType: string,
    endDate: Date,
    subscriptionId: string,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { userProfileId },
      data: {
        durationType,
        endDate,
        subscriptionId,
      },
    });
  }

  async createSubscription(
    data: {
      subscriptionId: string;
      durationType: string;
      startDate: Date;
      endDate: Date;
      userProfileId: number;
      autoRenewal?: boolean;
    },
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;

    return client.subscription.create({
      data: {
        subscriptionId: data.subscriptionId,
        durationType: data.durationType,
        startDate: data.startDate,
        endDate: data.endDate,
        userProfileId: data.userProfileId,
        autoRenewal: data.autoRenewal ?? false,
      },
    });
  }

  async findSubscriptionByProfileId(
    userProfileId: number,
  ): Promise<Subscription> {
    return this.prisma.subscription.findFirst({
      where: { userProfileId },
    });
  }

  async updateAutoRenewalById(subscriptionId: string, autoRenewal: boolean) {
    return this.prisma.subscription.update({
      where: { subscriptionId },
      data: { autoRenewal },
    });
  }

  async deletelSubscription(
    subscriptionId: string,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.delete({
      where: { subscriptionId },
    });
  }

  async findSubscriptionsExpiring(
    timeUntilExpiry: number,
    autoRenewal: boolean,
    unit: 'hours' | 'days' = 'hours',
  ) {
    const now = new Date();
    const multiplier = unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const expiryThreshold = new Date(
      now.getTime() + timeUntilExpiry * multiplier,
    );

    return this.prisma.subscription.findMany({
      where: {
        autoRenewal,
        endDate: {
          gt: now,
          lte: expiryThreshold,
        },
      },
      include: {
        userProfile: {
          select: {
            userId: true,
          },
        },
      },
    });
  }
}
