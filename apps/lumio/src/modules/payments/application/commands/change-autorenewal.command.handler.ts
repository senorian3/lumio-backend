import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsHttpAdapter } from '../payments-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { AppLoggerService } from '@libs/logger/logger.service';
import {
  ForbiddenDomainException,
  NotFoundDomainException,
} from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { InputChangeAutorenewalSubscriptionDto } from '@libs/dto/input/change-autorenewal-subscription.input.dto';
import { SubscriptionRepository } from '../../domain/infrastructure/subscription.repository';

export class ChangeAutoRenewalCommand {
  constructor(
    public readonly userId: number,
    public readonly dto: InputChangeAutorenewalSubscriptionDto,
  ) {}
}

@CommandHandler(ChangeAutoRenewalCommand)
export class ChangeAutoRenewalCommandHandler implements ICommandHandler<
  ChangeAutoRenewalCommand,
  void
> {
  constructor(
    private readonly paymentsHttpAdapter: PaymentsHttpAdapter,
    private readonly logger: AppLoggerService,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: ChangeAutoRenewalCommand): Promise<void> {
    const foundProfile =
      await this.externalQueryUserAccountsRepository.getProfileById(
        +command.dto.profileId,
      );

    if (!foundProfile) {
      throw NotFoundDomainException.create(
        'Profile does not exist',
        'profileId',
      );
    }

    const userProfile =
      await this.externalQueryUserAccountsRepository.getProfileByUserId(
        command.userId,
      );

    if (!userProfile) {
      throw ForbiddenDomainException.create('User has no profile', 'userId');
    }

    if (userProfile.id !== foundProfile.id) {
      throw ForbiddenDomainException.create(
        'User cannot change autorenewal for another user',
        'profileId',
      );
    }

    const userSubscription =
      await this.subscriptionRepository.findActiveSubscriptionByProfileId(
        foundProfile.id,
      );

    if (!userSubscription) {
      throw NotFoundDomainException.create(
        'User has no active subscription',
        'profileId',
      );
    }

    if (userSubscription.autoRenewal === command.dto.autoRenewal) {
      return;
    }

    try {
      await this.paymentsHttpAdapter.updateAutoRenewal<void>(
        `${GLOBAL_PREFIX}/subscription-payments/autorenewal`,
        command.dto,
      );
    } catch (error) {
      throw error;
    }

    try {
      await this.subscriptionRepository.updateAutoRenewalById(
        userSubscription.id,
        command.dto.autoRenewal,
      );
    } catch (error) {
      this.logger.error(
        `Critical error to update subscription autorenewal in DB for userId=${command.userId}: ${error.message}`,
        error?.stack,
        ChangeAutoRenewalCommand.name,
      );
      throw error;
    }
  }
}
