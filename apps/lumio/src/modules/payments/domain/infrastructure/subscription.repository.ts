import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Subscription } from 'generated/prisma-lumio';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionBySubscriptionId(
    subscriptionId: string,
  ): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { subscriptionId },
    });
  }

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
        cancelledAt: null,
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
      cancelledAt?: Date | null;
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
        cancelledAt: data.cancelledAt,
      },
    });
  }

  async findActiveSubscriptionByProfileId(
    userProfileId: number,
  ): Promise<Subscription> {
    return this.prisma.subscription.findFirst({
      where: { userProfileId, cancelledAt: null },
    });
  }

  async updateAutoRenewalById(subscriptionId: string, autoRenewal: boolean) {
    return this.prisma.subscription.update({
      where: { subscriptionId },
      data: { autoRenewal },
    });
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelledAt: Date,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { subscriptionId },
      data: {
        cancelledAt,
        autoRenewal: false,
      },
    });
  }
}
