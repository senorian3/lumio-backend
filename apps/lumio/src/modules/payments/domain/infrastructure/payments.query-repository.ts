import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lumio/prisma/prisma.service';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';

@Injectable()
export class QueryPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaymentsBySubscriptionIds(
    subscriptionIds: string[],
    query: GetUserPaymentsParams,
    includeSubscription: boolean = true,
  ): Promise<any> {
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

    const items = payments.map((payment) => ({
      id: payment.id,
      createdAt: payment.createdAt.toISOString(),
      datePayment: payment.datePayment.toISOString(),
      endDate: payment.endDate.toISOString(),
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentsService: payment.paymentsService,
      subscriptionId: payment.subscriptionId,
      durationType: payment.subscription?.durationType || null,
    }));

    return PaginatedViewDto.mapToView({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }
}
