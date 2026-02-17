import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PaymentsHttpAdapter } from '../payments-http.adapter';
import { GLOBAL_PREFIX } from '@libs/settings/global-prefix.setup';
import { BadRequestDomainException } from '@libs/core/exceptions/domain-exceptions';
import { InputCreateSubscriptionPaymentDto } from '@libs/dto/input/subscription-payment.input.dto';
import { ExternalQueryUserAccountsRepository } from '@lumio/modules/user-accounts/users/domain/infrastructure/user.external-query.repository';

export class CreateSubscriptionPaymentUrlCommand {
  constructor(
    public readonly userId: number,
    public readonly dto: InputCreateSubscriptionPaymentDto,
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
      }>(`${GLOBAL_PREFIX}/subscription-payments`, {
        ...command.dto,
        profileId: profileId.toString(),
      });

      return urlData.url;
    } catch (error) {
      throw error;
    }
  }
}
