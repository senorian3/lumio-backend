import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { Payments, Subscription } from 'generated/prisma-lumio';

@Injectable()
export class QueryPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSubscriptionsByUserProfileId(
    userProfileId: number,
    includeRelations: boolean = false,
  ): Promise<Subscription> {
    const subscriptions = await this.prisma.subscription.findFirst({
      where: { userProfileId },
      include: includeRelations
        ? {
            payments: true,
          }
        : undefined,
      orderBy: { startDate: 'desc' },
    });

    return subscriptions;
  }

  async findPaymentsBySubscriptionId(
    subscriptionId: string,
    includeSubscription: boolean = false,
  ): Promise<Payments[]> {
    const payments = await this.prisma.payments.findMany({
      where: { subscriptionId },
      include: includeSubscription
        ? {
            subscription: true,
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }
}
