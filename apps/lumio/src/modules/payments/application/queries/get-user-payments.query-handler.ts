import { GetUserPaymentsParams } from '@lumio/modules/payments/api/dto/input/get-user-payments.query';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { QueryPaymentsRepository } from '@lumio/modules/payments/domain/infrastructure/payments.query-repository';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SubscriptionRepository } from '@lumio/modules/payments/domain/infrastructure/subscription.repository';
import { PaginatedViewDto } from '@libs/core/dto/pagination/base.paginated.view-dto';

export class GetUserPaymentsQuery {
  constructor(
    public readonly userId: number,
    public readonly query: GetUserPaymentsParams,
  ) {}
}

@QueryHandler(GetUserPaymentsQuery)
export class GetUserPaymentsQueryHandler implements IQueryHandler<
  GetUserPaymentsQuery,
  any // Changed return type
> {
  constructor(
    private queryPaymentsRepository: QueryPaymentsRepository,
    private externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(query: GetUserPaymentsQuery): Promise<any> {
    const profile =
      await this.externalQueryUserAccountsRepository.getProfileByUserId(
        query.userId,
      );
    if (!profile) {
      throw NotFoundDomainException.create('Profile not found', 'profile');
    }

    const subscribers =
      await this.subscriptionRepository.findAllSubscriptionsByProfileId(
        profile.id,
      );

    if (!subscribers || subscribers.length === 0) {
      return PaginatedViewDto.mapToView({
        items: [],
        page: query.query.pageNumber,
        size: query.query.pageSize,
        totalCount: 0,
      });
    }

    const subscriptionIds = subscribers.map((sub) => sub.id);

    return await this.queryPaymentsRepository.findPaymentsBySubscriptionIds(
      subscriptionIds,
      query.query,
      true, // Include subscription to get durationType
    );
  }
}
