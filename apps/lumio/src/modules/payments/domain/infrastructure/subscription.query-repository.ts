import { PrismaService } from '@lumio/prisma/prisma.service';
import { Subscription } from 'generated/prisma-lumio';

export class QueryPaymentsSubscription {
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
}
