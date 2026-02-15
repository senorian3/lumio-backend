import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';

export interface PaymentsWithCount {
  payments: any[];
  totalCount: number;
}

@Injectable()
export class QueryPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentsBySubscriptionIds(
    subscriptionIds: string[],
    query: GetUserPaymentsParams,
    includeSubscription: boolean = true,
  ): Promise<PaymentsWithCount> {
    const whereOptions = {
      subscriptionId: {
        in: subscriptionIds,
      },
    };

    const sortDirection: 'asc' | 'desc' =
      query.sortDirection === 'asc' ? 'asc' : 'desc';
    const sortBy = 'createdAt';

    const orderOptions = { [sortBy]: sortDirection };

    const [payments, totalCount] = await Promise.all([
      this.prisma.payments.findMany({
        where: whereOptions,
        skip: query.calculateSkip(),
        take: query.pageSize,
        orderBy: orderOptions,
        include: includeSubscription ? { subscription: true } : undefined,
      }),
      this.prisma.payments.count({ where: whereOptions }),
    ]);

    return { payments, totalCount };
  }
}
