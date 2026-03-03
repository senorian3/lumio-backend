import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';
import { PaymentViewDto } from '@lumio/modules/payments/api/dto/output/user-payment.output.dto';
import { PaymentsHttpAdapter } from '../payments-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';

export class GetUserPaymentsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetUserPaymentsParams,
  ) {}
}

@QueryHandler(GetUserPaymentsQuery)
export class GetUserPaymentsQueryHandler implements IQueryHandler<
  GetUserPaymentsQuery,
  PaginatedViewDto<PaymentViewDto[]>
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly paymentsHttpAdapter: PaymentsHttpAdapter,
  ) {}

  async execute(
    query: GetUserPaymentsQuery,
  ): Promise<PaginatedViewDto<PaymentViewDto[]>> {
    const profile =
      await this.externalQueryUserAccountsRepository.getProfileByUserId(
        query.userId,
      );

    if (!profile) {
      throw NotFoundDomainException.create('Profile not found', 'profile');
    }

    const { payments, totalCount } =
      await this.paymentsHttpAdapter.findAllUserProfilePayments(
        `${GLOBAL_PREFIX}/subscription-payments/profile-payments`,
        profile.id,
      );

    const items: PaymentViewDto[] = PaymentViewDto.mapManyToView(payments);

    return PaginatedViewDto.mapToView({
      items,
      page: query.query.pageNumber,
      size: query.query.pageSize,
      totalCount,
    });
  }
}
