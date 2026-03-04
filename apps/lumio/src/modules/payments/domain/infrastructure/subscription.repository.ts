import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Subscription } from 'generated/prisma-lumio';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionById(id: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { id },
    });
  }

  async updateSubscriptionWithNewPayment(
    id: string,
    durationType: string,
    endDate: Date,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { id },
      data: {
        durationType,
        endDate,
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
        id: data.subscriptionId,
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
    profileId: number,
  ): Promise<Subscription> {
    return this.prisma.subscription.findFirst({
      where: {
        userProfileId: profileId,
        cancelledAt: null,
      },
    });
  }

  async updateAutoRenewalById(id: string, autoRenewal: boolean) {
    return this.prisma.subscription.update({
      where: { id },
      data: { autoRenewal },
    });
  }

  async cancelSubscription(
    id: string,
    cancelledAt: Date,
    tx?: any,
  ): Promise<Subscription> {
    const client = tx || this.prisma;
    return client.subscription.update({
      where: { id },
      data: {
        cancelledAt,
        autoRenewal: false,
      },
    });
  }
}
