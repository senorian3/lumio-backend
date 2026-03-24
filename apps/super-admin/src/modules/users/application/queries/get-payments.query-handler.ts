import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserQueryRepository } from '@super-admin/modules/users/domain/infrastructure/user.query-repository';
import { AppLoggerService } from '@libs/logger/logger.service';
import { UserWithProfileOutputDto } from '@super-admin/modules/users/api/dto/output/user-with-profile.output.dto';
import {
  FindManyOptionsInputDto,
  SortOrder,
} from '@super-admin/modules/users/api/dto/input/find-many-options.input.dto';
import { PaymentSortBy } from '@super-admin/modules/users/domain/schema/payment-sort-by.enum';
import { PaymentOutput } from '@super-admin/modules/users/domain/schema/payment.output.dto';
import { PaginatedPaymentResponse } from '@super-admin/modules/users/domain/schema/paginated-payment.entity';
import { PaymentsApiClient } from '@super-admin/modules/users/domain/infrastructure/payments-api.client';

export class GetPaymentsQuery {
  constructor(
    public readonly pageNumber: number = 1,
    public readonly pageSize: number = 6,
    public readonly search?: string,
    public readonly sortBy: PaymentSortBy = PaymentSortBy.CREATED_AT_DESC,
  ) {}
}

@QueryHandler(GetPaymentsQuery)
export class GetPaymentsHandler implements IQueryHandler<GetPaymentsQuery> {
  constructor(
    private readonly userQueryRepository: UserQueryRepository,
    private readonly paymentsApiClient: PaymentsApiClient,
    private readonly logger: AppLoggerService,
  ) {}

  async execute(query: GetPaymentsQuery): Promise<PaginatedPaymentResponse> {
    try {
      const skip = (query.pageNumber - 1) * query.pageSize;
      let profileIds: number[] | undefined;

      if (query.search?.trim()) {
        const userOptions: FindManyOptionsInputDto = {
          skip: 0,
          take: 1000,
          orderBy: SortOrder.ASC,
          sortBy: undefined,
          search: query.search.trim(),
        };

        const users = await this.userQueryRepository.findMany(userOptions);
        profileIds = users
          .filter((user) => user.profile?.id)
          .map((user) => user.profile!.id);

        if (profileIds.length === 0) {
          return {
            page: query.pageNumber,
            pageSize: query.pageSize,
            pagesCount: 0,
            totalCount: 0,
            items: [],
          };
        }
      }

      const { sortBy: paymentSortBy, sortOrder } = this.parseSortBy(
        query.sortBy,
      );

      const paymentsResponse = await this.paymentsApiClient.getAllPayments({
        profileIds: profileIds,
        skip,
        take: query.pageSize,
        sortBy: paymentSortBy,
        sortOrder,
        search: undefined,
      });

      const totalCount = paymentsResponse.totalCount;
      const pagesCount =
        totalCount > 0 ? Math.ceil(totalCount / query.pageSize) : 0;

      const paymentProfileIds = paymentsResponse.data
        .map((p) => p.profileId)
        .filter(Boolean);

      const userMap = await this.getUserMap(paymentProfileIds);

      const payments = paymentsResponse.data.map((payment) =>
        this.mapPaymentFromDto(payment, userMap),
      );

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: pagesCount,
        totalCount: totalCount,
        items: payments,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get payments: pageNumber=${query.pageNumber}, pageSize=${query.pageSize}, sortBy=${query.sortBy}`,
        error?.stack,
        GetPaymentsHandler.name,
      );

      return {
        page: query.pageNumber,
        pageSize: query.pageSize,
        pagesCount: 0,
        totalCount: 0,
        items: [],
      };
    }
  }

  private async getUserMap(
    profileIds: number[],
  ): Promise<Map<number, UserWithProfileOutputDto>> {
    if (profileIds.length === 0) {
      return new Map();
    }

    const uniqueProfileIds = [...new Set(profileIds)];

    const users =
      await this.userQueryRepository.findByProfileIds(uniqueProfileIds);

    const userMap = new Map<number, UserWithProfileOutputDto>();
    users.forEach((user) => {
      if (user.profile?.id) {
        userMap.set(user.profile.id, user);
      }
    });

    return userMap;
  }

  private parseSortBy(sortBy: PaymentSortBy): {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  } {
    let paymentSortBy = 'createdAt';
    let sortOrder: 'asc' | 'desc' = 'desc';

    switch (sortBy) {
      case PaymentSortBy.USERNAME_ASC:
      case PaymentSortBy.USERNAME_DESC:
        paymentSortBy = 'createdAt';
        sortOrder = sortBy === PaymentSortBy.USERNAME_ASC ? 'asc' : 'desc';
        break;
      case PaymentSortBy.CREATED_AT_ASC:
        paymentSortBy = 'createdAt';
        sortOrder = 'asc';
        break;
      case PaymentSortBy.CREATED_AT_DESC:
        paymentSortBy = 'createdAt';
        sortOrder = 'desc';
        break;
      case PaymentSortBy.AMOUNT_ASC:
        paymentSortBy = 'amount';
        sortOrder = 'asc';
        break;
      case PaymentSortBy.AMOUNT_DESC:
        paymentSortBy = 'amount';
        sortOrder = 'desc';
        break;
      case PaymentSortBy.PAYMENT_METHOD_ASC:
        paymentSortBy = 'paymentProvider';
        sortOrder = 'asc';
        break;
      case PaymentSortBy.PAYMENT_METHOD_DESC:
        paymentSortBy = 'paymentProvider';
        sortOrder = 'desc';
        break;
    }

    return { sortBy: paymentSortBy, sortOrder };
  }

  private mapPaymentFromDto(
    dto: any,
    userMap: Map<number, UserWithProfileOutputDto>,
  ): PaymentOutput {
    const user = userMap.get(dto.profileId);

    return {
      // 🔹 Payment данные
      id: dto.id,
      customPaymentId: dto.customPaymentId,
      profileId: dto.profileId,
      autoRenewal: dto.autoRenewal ?? true,
      paymentProvider: dto.paymentProvider,
      currency: dto.currency,
      amount: dto.amount,
      status: dto.status ?? 'pending',
      createdAt: new Date(dto.createdAt),
      nextPaymentDate: dto.nextPaymentDate
        ? new Date(dto.nextPaymentDate)
        : undefined,
      stripePaymentCreatedAt: new Date(dto.stripePaymentCreatedAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : undefined,
      subscriptionId: dto.subscriptionId || undefined,
      mainSubscriptionId: dto.mainSubscriptionId || undefined,
      stripeSubscriptionId: dto.stripeSubscriptionId || undefined,
      subscriptionType: dto.subscriptionType,
      periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
      periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
      paymentsUrl: dto.paymentsUrl,

      // 👤 User данные
      username: user?.username ?? 'Unknown',
      avatarUrl: user?.profile?.avatarUrl ?? undefined,
      firstName: user?.profile?.firstName ?? undefined,
      lastName: user?.profile?.lastName ?? undefined,
    };
  }
}
