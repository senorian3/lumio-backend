import { Injectable } from '@nestjs/common';
import { PrismaService } from '@payments/prisma/prisma.service';
import { Payment } from '@generated/prisma-payments';

@Injectable()
export class QueryPaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPayments(
    profileIds?: number[],
    skip: number = 0,
    take: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
    search?: string,
  ): Promise<{ data: Payment[]; totalCount: number }> {
    const where: any = {};

    if (profileIds?.length) {
      where.profileId = { in: profileIds };
    }

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
