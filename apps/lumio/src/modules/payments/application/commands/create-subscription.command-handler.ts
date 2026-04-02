import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsHttpAdapter } from '../payments-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';
import { InputCreateSubscriptionPaymentUrlDto } from '@payments/modules/subscriptions/subscription-payments/api/dto/input/input-create-subscription-payment-url.dto';

export class CreateSubscriptionPaymentUrlCommand {
  constructor(
    public readonly userId: number,
    public readonly dto: InputCreateSubscriptionPaymentUrlDto,
    public readonly localhostOrigin?: string,
  ) {}
}

@CommandHandler(CreateSubscriptionPaymentUrlCommand)
export class CreateSubscriptionPaymentUrlCommandHandler implements ICommandHandler<
  CreateSubscriptionPaymentUrlCommand,
  string
> {
  constructor(
    private readonly paymentsHttpAdapter: PaymentsHttpAdapter,
    private readonly externalQueryUserAccountsRepository: ExternalQueryUserAccountsRepository,
  ) {}

  async execute(command: CreateSubscriptionPaymentUrlCommand): Promise<string> {
    const profileId =
      await this.externalQueryUserAccountsRepository.getProfileIdByUserId(
        command.userId,
      );

    if (!profileId) {
      throw BadRequestDomainException.create(
        'Profile does not exist',
        'userId',
      );
    }

    try {
      const urlData = await this.paymentsHttpAdapter.createPaymentUrl<{
        url: string;
      }>(`${GLOBAL_PREFIX}/subscription-payments/create-url`, {
        ...command.dto,
        profileId: profileId.toString(),
        localhostOrigin: command.localhostOrigin,
      });

      return urlData.url;
    } catch (error) {
      throw error;
    }
  }
}
