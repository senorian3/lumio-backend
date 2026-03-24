// @payments/modules/subscriptions/subscription-payments/application/queries/get-all-payments.query-handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@payments/prisma/prisma.service';

export class GetAllPaymentsQuery {
  constructor(
    public readonly profileIds?: number[],
    public readonly skip: number = 0,
    public readonly take: number = 10,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    public readonly search?: string,
  ) {}
}

@QueryHandler(GetAllPaymentsQuery)
export class GetAllPaymentsHandler implements IQueryHandler<GetAllPaymentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetAllPaymentsQuery) {
    const { profileIds, skip, take, sortBy, sortOrder, search } = query;

    const where: any = {};

    // Фильтр по profileIds
    if (profileIds?.length) {
      where.profileId = { in: profileIds };
    }

    // Поиск (если нужно искать по subscriptionType или status)
    if (search) {
      where.OR = [
        { subscriptionType: { contains: search, mode: 'insensitive' } },
        { status: { contains: search, mode: 'insensitive' } },
        { paymentProvider: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data,
      totalCount,
    };
  }
}
