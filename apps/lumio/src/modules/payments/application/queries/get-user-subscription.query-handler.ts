import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OutputUserSubscriptionDto } from '@lumio/modules/payments/api/dto/output/user-subscription.output.dto';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { NotFoundDomainException } from '@libs/core/exceptions/domain-exceptions';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';

export class GetUserSubscriptionQuery {
  constructor(public readonly userId: number) {}
}

@QueryHandler(GetUserSubscriptionQuery)
export class GetUserSubscriptionQueryHandler implements IQueryHandler<
  GetUserSubscriptionQuery,
  OutputUserSubscriptionDto
> {
  constructor(
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(
    query: GetUserSubscriptionQuery,
  ): Promise<OutputUserSubscriptionDto> {
    const profile =
      await this.externalQueryUserAccountsRepository.getProfileByUserId(
        query.userId,
      );

    if (!profile) {
      throw NotFoundDomainException.create('Profile not found', 'profile');
    }

    const userSubscription =
      await this.subscriptionRepository.findActiveSubscriptionByProfileId(
        profile.id,
      );

    if (!userSubscription) {
      throw NotFoundDomainException.create(
        "User doesn't have active subscription",
        'userId',
      );
    }

    return {
      id: userSubscription.subscriptionId,
      accountType: 'Business',
      durationType: userSubscription.durationType,
      endDate: userSubscription.endDate,
      nextPaymentDate: userSubscription.endDate,
      autoRenewal: userSubscription.autoRenewal,
    };
  }
}
