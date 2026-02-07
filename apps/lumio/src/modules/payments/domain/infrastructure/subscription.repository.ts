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

  async updateSubscriptionWithNewPayment(
    subscriptionId: number,
    newPaymentId: number,
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
        paymentId: newPaymentId,
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
}
